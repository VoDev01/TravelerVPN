import AsyncStorage from "@react-native-async-storage/async-storage";
import CancelIcon from "@/assets/images/at-icons_cross.svg";
import DeleteIcon from "@/assets/images/bi_trash-fill.svg";
import EditIcon from "@/assets/images/bxs_pencil.svg";
import { Loader } from "@/components/Loader";
import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { ServerMetrics } from "@/hooks/useBackendClient";
import { useLibxray } from "@/hooks/useLibxray";
import { useServers } from "@/hooks/useServers";
import { MetricsServerData } from "@/hooks/useWebSocketClient";
import { PingBatchItem } from "expo-libxray";
import {
	Href,
	useLocalSearchParams,
	useNavigation,
	useRouter,
} from "expo-router";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { ServerEntity } from "../../db/schema/servers";

const METRICS_STORAGE_KEY = "travelervpn.serverMetrics.v1";

type StoredMetric = { latencyMs: number; status: string };
type MetricsCache = Record<string, StoredMetric>;

const readMetricsCache = async (): Promise<MetricsCache> => {
	try {
		const raw = await AsyncStorage.getItem(METRICS_STORAGE_KEY);
		return raw ? (JSON.parse(raw) as MetricsCache) : {};
	} catch (e) {
		console.error("Failed to read latency cache:", e);
		return {};
	}
};

interface MetricsServerSection {
	title: string;
	data: MetricsServerData[];
}

interface ServersScreenContentProps {
	setSelectedServer: (id: number) => void;
	selectedServer: number | undefined;
	deleteMode: boolean;
	selectedForDeletion: Set<number>;
	onToggleDelete: (id: number) => void;
	setIsUserServersEmpty: (empty: boolean) => void;
}

function ServersScreenContent({
	setSelectedServer,
	selectedServer,
	deleteMode,
	selectedForDeletion,
	onToggleDelete,
	setIsUserServersEmpty,
}: ServersScreenContentProps) {
	const [servers, setServers] = useState<MetricsServerSection[]>([]);
	const { pingBatch, buildPingConfig, getXrayState } = useLibxray();

	// Full-screen loader covers only the first server fetch, never the pings.
	const [booting, setBooting] = useState(true);
	// Pull-to-refresh spinner; cleared when the background ping run replaces values.
	const [refreshing, setRefreshing] = useState(false);
	const loadingRef = useRef(false);
	const pingRunIdRef = useRef(0);
	const metricsCacheRef = useRef<MetricsCache>({});

	const { fetchServers } = useServers();
	const { city } = useLocalSearchParams<{ city?: string }>();

	const theme = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const { t } = useTranslation();

	const buildSections = (data: ServerEntity[]): MetricsServerSection[] => {
		const withCachedMetrics = (server: ServerEntity): MetricsServerData => {
			const cached = metricsCacheRef.current[String(server.id)];
			return {
				...server,
				metrics: cached
					? { latencyMs: BigInt(cached.latencyMs), status: cached.status }
					: null,
			};
		};

		const appServersData = data
			.filter((server) => server.type !== "user_defined")
			.map(withCachedMetrics);

		const userServersData = data
			.filter((server) => server.type === "user_defined")
			.map(withCachedMetrics);

		const sections: MetricsServerSection[] = [];

		if (appServersData.length > 0) {
			sections.push({
				title: t("section_subscription_servers"),
				data: appServersData,
			});
		}

		if (userServersData.length > 0) {
			sections.push({
				title: t("section_user_servers"),
				data: userServersData,
			});
		}
		setIsUserServersEmpty(userServersData.length === 0);
		return sections;
	};

	const persistCache = () => {
		AsyncStorage.setItem(
			METRICS_STORAGE_KEY,
			JSON.stringify(metricsCacheRef.current),
		).catch((e) => console.error("Failed to persist latency cache:", e));
	};

	// Update one server's metric live, mirror it into the persisted cache, and
	// patch just its row without blocking the list on the rest of the probes.
	const applyMetric = (id: number, metric: ServerMetrics | null) => {
		if (metric) {
			metricsCacheRef.current[String(id)] = {
				latencyMs: Number(metric.latencyMs),
				status: metric.status,
			};
			persistCache();
		} else {
			delete metricsCacheRef.current[String(id)];
		}
		setServers((prev) =>
			prev.map((section) => ({
				...section,
				data: section.data.map((server) =>
					server.id === id ? { ...server, metrics: metric } : server,
				),
			})),
		);
	};

	// Latency probe. Uses buildPingConfig (raw outbound, no `sendThrough`) because
	// the tester runs as a plain process; up to 5 configs run concurrently per
	// pingBatch call, and batches/configs are built sequentially so two calls
	// never hit the shared LibXray Go core at once. Each finished batch patches
	// the rows in place; a newer run (higher runId) aborts this one.
	const pingMetrics = async (
		flatServers: MetricsServerData[],
		runId: number,
	) => {
		const BATCH_SIZE = 5;

		for (let i = 0; i < flatServers.length; i += BATCH_SIZE) {
			if (pingRunIdRef.current !== runId) return;
			const batchItems = flatServers.slice(i, i + BATCH_SIZE);

			const configsPayload: PingBatchItem[] = [];
			for (const server of batchItems) {
				try {
					const xrayJson = await buildPingConfig(server.connectionLink);
					configsPayload.push({ xrayJson, outboundTag: undefined });
				} catch (e) {
					console.error("Failed to build Xray config for ping:", e);
					configsPayload.push({ xrayJson: "", outboundTag: undefined });
				}
			}

			let batchResponse: Awaited<ReturnType<typeof pingBatch>> | undefined;
			try {
				batchResponse = await pingBatch({
					configs: configsPayload,
					timeout: 5,
					url: "https://cp.cloudflare.com/",
					locationUrl: undefined,
				});
			} catch (e) {
				console.error("pingBatch failed:", e);
				continue;
			}
			if (pingRunIdRef.current !== runId) return;

			for (let j = 0; j < batchItems.length; j++) {
				const responseItem = batchResponse?.results?.[j];
				if (!responseItem) continue;
				applyMetric(batchItems[j].id, {
					latencyMs: responseItem.delay ?? 1000n,
					status: responseItem.success ? "success" : "timeout",
				});
			}
		}
	};

	const startBackgroundPing = (
		sections: MetricsServerSection[],
		shouldClearRefreshing: boolean,
	) => {
		const flatServers = sections.flatMap((section) => section.data);
		if (flatServers.length === 0) {
			if (shouldClearRefreshing) setRefreshing(false);
			return;
		}
		pingRunIdRef.current += 1;
		const runId = pingRunIdRef.current;

		(async () => {
			// Skip probes while the tunnel is up: the shared Xray core cannot run
			// its tester against a live VPN, so every probe fails.
			let connected = false;
			try {
				const xrayState = JSON.parse(await getXrayState());
				connected = xrayState.data.running;
			} catch (e) {
				console.error(e);
			}

			if (!connected) {
				await pingMetrics(flatServers, runId);
			}
			if (shouldClearRefreshing && pingRunIdRef.current === runId) {
				setRefreshing(false);
			}
		})();
	};

	// Fetch servers, paint them immediately from cached latencies, then re-probe
	// in the background. "refresh" replaces the saved results before re-measuring;
	// "mount" keeps the cache visible while the new probes land.
	const loadServers = async (mode: "mount" | "refresh") => {
		if (loadingRef.current) {
			return;
		}
		loadingRef.current = true;
		const isRefresh = mode === "refresh";
		try {
			if (isRefresh) {
				pingRunIdRef.current += 1;
				metricsCacheRef.current = {};
				AsyncStorage.removeItem(METRICS_STORAGE_KEY).catch((e) =>
					console.error("Failed to clear latency cache:", e),
				);
				setRefreshing(true);
			} else {
				metricsCacheRef.current = await readMetricsCache();
			}

			const data = await fetchServers();

			const currentIds = new Set(data.map((server) => String(server.id)));
			for (const cachedId of Object.keys(metricsCacheRef.current)) {
				if (!currentIds.has(cachedId)) {
					delete metricsCacheRef.current[cachedId];
				}
			}

			const sections = buildSections(data);
			setServers(sections);
			startBackgroundPing(sections, isRefresh);
		} catch (e) {
			console.error("Error loading servers:", e);
			if (isRefresh) setRefreshing(false);
		} finally {
			loadingRef.current = false;
			setBooting(false);
		}
	};

	useEffect(() => {
		loadServers("mount");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const renderServer = ({ item }: { item: MetricsServerData }) => {
		const isDeleteSelected = selectedForDeletion.has(item.id);
		const borderColor = isDeleteSelected
			? theme.colors.important1
			: item.id === selectedServer && !deleteMode
				? theme.colors.important2
				: "#00000000";
		return (
			<TouchableOpacity
				disabled={deleteMode && item.type !== "user_defined"}
				activeOpacity={deleteMode && item.type !== "user_defined" ? 1 : 0.7}
				style={[styles.serverRow, { borderColor }]}
				onPress={() => {
					if (deleteMode) onToggleDelete(item.id);
					else setSelectedServer(item.id);
				}}>
				<View style={styles.serverInfo}>
					<Text style={styles.serverInfoFlag}>
						{String.fromCodePoint(
							...item.countryTag
								.toUpperCase()
								.split("")
								.map((char) => 127397 + char.charCodeAt(0)),
						)}
					</Text>

					<View style={styles.serverInfoTextContainer}>
						<Text
							style={styles.serverInfoText}
							numberOfLines={1}
							ellipsizeMode="tail">
							{item.remark.length > 30
								? `${item.remark.slice(0, 30)}...`
								: item.remark}
						</Text>
						<Text style={[styles.serverInfoText, { flexShrink: 0 }]}>
							{!item.metrics || item.metrics.latencyMs > 1000
								? "? ms"
								: `${item.metrics.latencyMs} ms`}
						</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	const renderSectionHeader = ({
		section: { title },
	}: {
		section: MetricsServerSection;
	}) => <Text style={styles.serversCategoryTitle}>{title}</Text>;

	if (booting) {
		return <Loader loaderText={t("loader_servers")} />;
	}

	const visibleServers = deleteMode
		? servers
				.map((section) => ({
					...section,
					data: section.data.filter((server) => server.type === "user_defined"),
				}))
				.filter((section) => section.data.length > 0)
		: city
			? servers
					.map((section) => ({
						...section,
						data: section.data.filter((server) => server.city === city),
					}))
					.filter((section) => section.data.length > 0)
			: servers;

	return (
		<SectionList
			sections={visibleServers}
			keyExtractor={(item) => item.id.toString()}
			renderItem={renderServer}
			renderSectionHeader={renderSectionHeader}
			ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
			SectionSeparatorComponent={() => <View style={{ height: 24 }} />}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={() => {
						loadServers("refresh");
					}}
					tintColor={theme.colors.background}
				/>
			}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>{t("no_available_servers")}</Text>
				</View>
			}
		/>
	);
}

export default function ServersScreen() {
	const navigation = useNavigation();

	const [selectedServer, setSelectedServer] = useState<number>();
	const [deleteMode, setDeleteMode] = useState(false);
	const [selectedForDeletion, setSelectedForDeletion] = useState<Set<number>>(
		new Set(),
	);
	const [isUserServersEmpty, setIsUserServersEmpty] = useState(true);

	const [isDeleting, setIsDeleting] = useState(false);

	const { t } = useTranslation();

	const router = useRouter();
	const { deleteUserServers, getServerById } = useServers();

	const theme = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const insets = useSafeAreaInsets();

	const headerHeight = useHeaderHeight();
	const paddingTop = headerHeight + 16;
	const paddingBottom = insets.bottom;

	const toggleDeleteSelection = (id: number) => {
		setSelectedForDeletion((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const editSelectedServer = async () => {
		if (!selectedServer) {
			Toast.show({
				type: "info",
				text2: "Select a user-defined server to update",
			});
			return;
		}
		try {
			const server = await getServerById(selectedServer);
			if (server?.type !== "user_defined") {
				return;
			}
			router.push({
				pathname: "/server-edit",
				params: { serverId: `${selectedServer}` },
			} as unknown as Href);
		} catch (error) {
			console.error(error);
		}
	};

	const handleDeleteAction = async () => {
		if (!deleteMode) {
			setSelectedServer(undefined);
			setDeleteMode(true);
			return;
		}
		if (selectedForDeletion.size === 0) {
			Toast.show({
				type: "error",
				text1: "Select at least one user-defined server",
			});
			return;
		}

		if (isDeleting) return;
		setIsDeleting(true);
		try {
			await deleteUserServers([...selectedForDeletion]);
			setSelectedForDeletion(new Set());
			setDeleteMode(false);
		} catch (error) {
			console.error(error);
		} finally {
			setIsDeleting(false);
		}
	};

	const cancelDelete = () => {
		setSelectedForDeletion(new Set());
		setDeleteMode(false);
	};

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				if (!isUserServersEmpty)
					return (
						<View style={styles.actions}>
							{deleteMode ? (
								<CancelIcon width={32} height={32} onPress={cancelDelete} />
							) : (
								<EditIcon width={32} height={32} onPress={editSelectedServer} />
							)}
							<DeleteIcon width={32} height={32} onPress={handleDeleteAction} />
						</View>
					);
			},
		});
	}, [navigation, selectedServer, deleteMode]);

	return (
		<View style={[styles.container, { paddingTop, paddingBottom }]}>
			<Text style={styles.title}>
				{deleteMode
					? "Select user-defined servers to delete"
					: t("available_servers")}
			</Text>

			<ServersScreenContent
				setSelectedServer={setSelectedServer}
				selectedServer={selectedServer}
				deleteMode={deleteMode}
				selectedForDeletion={selectedForDeletion}
				onToggleDelete={toggleDeleteSelection}
				setIsUserServersEmpty={setIsUserServersEmpty}
			/>

			{!deleteMode && (
				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={[styles.button, styles.submitButton]}
						onPress={() => {
							if (!selectedServer) {
								console.error("No server selected");
								return;
							}
							// Navigate to the status screen and tell it which server to bind.
							// The index plays the flight animation first, then starts the VPN
							// service when the plane lands (connectNonce forces a re-bind even
							// when reconnecting to the same server).
							router.navigate({
								pathname: "/",
								params: {
									selectedServerId: `${selectedServer}`,
									connectNonce: `${Date.now()}`,
								},
							} as Href);
						}}>
						<Text style={styles.buttonText}>{t("connect")}</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			rowGap: 12,
		},
		actions: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			columnGap: 8,
		},
		actionButton: {
			backgroundColor: theme.colors.card,
			borderRadius: 10,
			paddingHorizontal: 14,
			paddingVertical: 8,
		},
		deleteAction: {
			backgroundColor: theme.colors.important1,
		},
		actionText: {
			color: theme.colors.secondary,
			fontFamily: "Nunito-Regular",
			fontSize: 15,
		},
		navigation: {
			flex: 1,
			flexDirection: "row",
			justifyContent: "flex-start",
		},
		title: {
			color: theme.colors.text,
			fontSize: 26,
			fontWeight: "600",
			textAlign: "center",
			marginBottom: 24,
			fontFamily: "Nunito-Regular",
		},
		serverList: {
			flex: 1,
			marginBottom: 24,
		},
		serverListScrollContent: {
			flexGrow: 1,
			rowGap: 24,
		},
		buttonContainer: {
			flexDirection: "row",
			justifyContent: "center",
			width: "100%",
		},
		button: {
			paddingHorizontal: 24,
			marginBottom: 24,
			paddingVertical: 12,
			borderRadius: 12,
			width: "65%",
			justifyContent: "center",
			alignItems: "center",
		},
		cancelButton: {
			backgroundColor: theme.colors.important1,
		},
		submitButton: {
			backgroundColor: theme.colors.important2,
		},
		buttonText: {
			color: theme.colors.background,
			fontSize: 24,
			fontFamily: "Nunito-Regular",
		},
		serversContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			rowGap: 24,
		},
		serverRow: {
			alignItems: "center",
			justifyContent: "space-between",
			paddingVertical: 14,
			backgroundColor: theme.colors.card,
			borderRadius: 12,
			borderWidth: 2,
		},
		serverInfo: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: 18,
		},
		serverInfoFlag: {
			fontSize: 20,
			flex: 1,
		},
		serverInfoTextContainer: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			flex: 6,
		},
		serverInfoText: {
			color: theme.colors.text_input,
			fontSize: 14,
			fontFamily: "Nunito-Regular",
		},
		serversCategoryTitle: {
			color: theme.colors.text,
			fontSize: 20,
			fontFamily: "Nunito-Regular",
		},
		emptyContainer: {
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
			textAlign: "center",
		},
		emptyText: {
			fontSize: 24,
			color: theme.colors.text,
		},
	});
