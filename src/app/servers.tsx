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
import { useEffect, useMemo, useState } from "react";
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
	const { pingBatch, convertShareLinksToJson } = useLibxray();
	//const [appServers, setAppServers] = useState<MetricsServerData[]>([]);

	const [isRefreshing, setIsRefreshing] = useState(true);

	const { fetchServers, refreshServers } = useServers();
	const { city } = useLocalSearchParams<{ city?: string }>();

	const theme = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const { t } = useTranslation();

	//const { serversMetrics, wsClose } = useWebSocketClient();

	const setServersSections = () => {
		fetchServers().then((data) => {
			if (data.length === servers.length) return;

			const appServersData = data
				.filter((server) => server.type !== "user_defined")
				.map((server) => {
					return { ...server, metrics: null };
				});

			//setAppServers([...appServersData]);

			const userServersData = data
				.filter((server) => server.type === "user_defined")
				.map((server) => {
					return { ...server, metrics: null };
				});

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
				setIsUserServersEmpty(false);
			} else {
				setIsUserServersEmpty(true);
			}
			setServers(sections);
			setIsRefreshing(false);
		});
	};

	const updateServersMetrics = async () => {
		try {
			const flatServers = servers.flatMap((v) => v.data);

			const jsonConfigs: string[] = await Promise.all(
				flatServers.map(async (server) => {
					return JSON.parse(
						await convertShareLinksToJson(server.connectionLink),
					).data;
				}),
			);

			const metricsResults: (ServerMetrics | null)[] = new Array(
				flatServers.length,
			).fill(null);

			const BATCH_SIZE = 5;

			for (let i = 0; i < jsonConfigs.length; i += BATCH_SIZE) {
				const batchItems = jsonConfigs.slice(i, i + BATCH_SIZE);
				const configsPayload: PingBatchItem[] = batchItems.map((config) => {
					const xrayJsonString =
						typeof config === "string" ? config : JSON.stringify(config);

					return {
						xrayJson: xrayJsonString,
						outboundTag: undefined,
					};
				});

				const batchResponse = await pingBatch({
					configs: configsPayload,
					timeout: 5000,
					url: "https://google.com",
				});

				for (let j = 0; j < batchItems.length; j++) {
					if (batchResponse.results && batchResponse.results[j]) {
						const responseItem = batchResponse.results[j];

						if (responseItem && responseItem.success) {
							metricsResults[i + j] = {
								latencyMs: responseItem.delay ?? 1000n,
								status: "success",
							};
						} else {
							metricsResults[i + j] = {
								latencyMs: responseItem.delay ?? 1000n,
								status: "timeout",
							};
						}
					}
				}
			}

			let globalIndex = 0;
			const updatedSections: MetricsServerSection[] = servers.map(
				(section) => ({
					title: section.title,
					data: section.data.map((server): MetricsServerData => {
						const metrics = metricsResults[globalIndex];
						globalIndex++;

						return {
							...server,
							metrics: metrics,
						};
					}),
				}),
			);

			setServers(updatedSections);
		} catch (error) {
			console.error("Error pinging in batches:", error);
		}
	};

	useEffect(() => {
		setServersSections();
	}, [isRefreshing]);

	// useEffect(() => {
	// 	if (appServers.length > 0) serversMetrics(appServers);

	// 	return () => {
	// 		wsClose();
	// 	};
	// }, [appServers]);

	useEffect(() => {
		updateServersMetrics();
	}, [isRefreshing]);

	const onRefresh = () => {
		setIsRefreshing(true);
		refreshServers()
			.then(() => {
				setServersSections();
			})
			.catch((e) => {
				console.error(e);
			});

		setIsRefreshing(false);
	};

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
							{item.remark.length > 25
								? `${item.remark.slice(0, 25)}...`
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

	if (isRefreshing) {
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
					refreshing={isRefreshing}
					onRefresh={onRefresh}
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
							if (selectedServer) {
								router.navigate({
									pathname: "/",
									params: { selectedServerId: `${selectedServer}` },
								});
							} else console.error("No server selected");
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
