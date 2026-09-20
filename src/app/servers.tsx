import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { useServers } from "@/hooks/useServers";
import { MetricsServerData } from "@/hooks/useWebSocketClient";
import { showToast } from "@/utility/toast";
import { getOrCreateUserId } from "@/utility/userId";
import {
	Href,
	useFocusEffect,
	useLocalSearchParams,
	useRouter,
} from "expo-router";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MetricsServerSection {
	title: string;
	data: MetricsServerData[];
}

function ServersScreenContent({
	setSelectedServer,
	selectedServer,
	deleteMode,
	selectedForDeletion,
	onToggleDelete,
	reloadKey,
}: {
	setSelectedServer: (id: number) => void;
	selectedServer: number | undefined;
	deleteMode: boolean;
	selectedForDeletion: Set<number>;
	onToggleDelete: (id: number) => void;
	reloadKey: number;
}) {
	const [servers, setServers] = useState<MetricsServerSection[]>([]);

	const [userId, setUserId] = useState("");
	const [isRefreshing, setIsRefreshing] = useState(true);

	const { fetchServers, refreshServers } = useServers();
	const { city } = useLocalSearchParams<{ city?: string }>();

	const theme = useAppTheme();
	const styles = createStyles(theme);

	const setServersAndMetrics = (userId: string) => {
		fetchServers(userId).then((data) => {
			const appServers = data
					.filter((server) => server.type !== "user_defined")
					.map((server) => {
						return { ...server, metrics: null };
					});

			const userServers = data
					.filter((server) => server.type === "user_defined")
					.map((server) => {
						return { ...server, metrics: null };
					});

			const sections: MetricsServerSection[] = [];

			if (appServers.length > 0) {
				sections.push({
					title: "App servers",
					data: appServers,
				});
			}

			if (userServers.length > 0) {
				sections.push({
					title: "User servers",
					data: userServers,
				});
			}
			setServers(sections);
			setIsRefreshing(false);
		});
	};

	useEffect(() => {
		getOrCreateUserId().then(setUserId).catch(console.error);
	}, []);

	useEffect(() => {
		setIsRefreshing(true);
		if (userId !== "") setServersAndMetrics(userId);
	}, [reloadKey, userId]);

	const onRefresh = () => {
		setIsRefreshing(true);
		refreshServers()
			.then(() => {
				setServersAndMetrics(userId);
			})
			.catch((e) => {
				console.error(e);
				setIsRefreshing(false);
				showToast("Unable to refresh servers");
			});
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
							{item.remark}
						</Text>
						<Text style={[styles.serverInfoText, { flexShrink: 0 }]}>
							{item.metrics ? item.metrics.latencyMs : "?"} ms
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
		return (
			<View style={styles.serversContainer}>
				<ActivityIndicator size="large" color={theme.colors.background} />
				<Text style={{ color: theme.colors.text, marginTop: 10 }}>
					Загрузка серверов...
				</Text>
			</View>
		);
	}

	const visibleServers = deleteMode
		? servers
				.map((section) => ({
					...section,
					data: section.data.filter(
						(server) => server.type === "user_defined",
					),
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
					<Text style={styles.emptyText}>No available servers found</Text>
				</View>
			}
		/>
	);
}

export default function ServersScreen() {
	const [selectedServer, setSelectedServer] = useState<number>();
	const [deleteMode, setDeleteMode] = useState(false);
	const [selectedForDeletion, setSelectedForDeletion] = useState<Set<number>>(
		new Set(),
	);
	const [reloadKey, setReloadKey] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);
	const { t } = useTranslation();
	const router = useRouter();
	const { deleteUserServers, getServerById } = useServers();

	const theme = useAppTheme();
	const styles = createStyles(theme);
	const insets = useSafeAreaInsets();

	const headerHeight = useHeaderHeight();
	const paddingTop = headerHeight + 16;
	const paddingBottom = insets.bottom;

	useFocusEffect(
		useCallback(() => {
			setReloadKey((key) => key + 1);
		}, []),
	);

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
			showToast("Select a user-defined server to update");
			return;
		}
		try {
			const server = await getServerById(selectedServer);
			if (server?.type !== "user_defined") {
				showToast("Only user-defined servers can be updated");
				return;
			}
			router.push({
				pathname: "/server-edit",
				params: { serverId: `${selectedServer}` },
			} as unknown as Href);
		} catch (error) {
			console.error(error);
			showToast("Unable to load the selected server");
		}
	};

	const handleDeleteAction = async () => {
		if (!deleteMode) {
			setSelectedServer(undefined);
			setDeleteMode(true);
			return;
		}
		if (selectedForDeletion.size === 0) {
			showToast("Select at least one user-defined server");
			return;
		}

		if (isDeleting) return;
		setIsDeleting(true);
		try {
			await deleteUserServers([...selectedForDeletion]);
			setSelectedForDeletion(new Set());
			setDeleteMode(false);
			setReloadKey((key) => key + 1);
			showToast("Selected servers deleted");
		} catch (error) {
			console.error(error);
			showToast("Unable to delete selected servers");
		} finally {
			setIsDeleting(false);
		}
	};

	const cancelDelete = () => {
		setSelectedForDeletion(new Set());
		setDeleteMode(false);
	};

	return (
		<View style={[styles.container, { paddingTop, paddingBottom }]}>
			<View style={styles.actions}>
				{deleteMode ? (
					<TouchableOpacity style={styles.actionButton} onPress={cancelDelete}>
						<Text style={styles.actionText}>Cancel</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity style={styles.actionButton} onPress={editSelectedServer}>
						<Text style={styles.actionText}>Update</Text>
					</TouchableOpacity>
				)}
				<TouchableOpacity
					disabled={isDeleting}
					style={[styles.actionButton, styles.deleteAction]}
					onPress={handleDeleteAction}>
					<Text style={styles.actionText}>
						{isDeleting
							? "Deleting..."
							: deleteMode
								? `Delete (${selectedForDeletion.size})`
								: "Delete"}
					</Text>
				</TouchableOpacity>
			</View>
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
				reloadKey={reloadKey}
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
			alignSelf: "flex-end",
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
			fontFamily: "CustomFont-Regular",
			fontSize: 15,
		},
		navigation: {
			flex: 1,
			flexDirection: "row",
			justifyContent: "flex-start",
		},
		title: {
			color: theme.colors.secondary,
			fontSize: 26,
			fontWeight: "600",
			textAlign: "center",
			marginBottom: 24,
			fontFamily: "CustomFont-Regular",
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
			fontFamily: "CustomFont-Regular",
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
			paddingHorizontal: 16,
			backgroundColor: theme.colors.tretiary,
			borderRadius: 12,
			borderWidth: 2,
		},
		serverInfo: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingHorizontal: 16,
		},
		serverInfoFlag: {
			fontSize: 20,
			flex: 1,
		},
		serverInfoTextContainer: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-around",
			flex: 4,
		},
		serverInfoText: {
			color: theme.colors.text,
			fontSize: 16,
			fontFamily: "CustomFont-Regular",
		},
		serversCategoryTitle: {
			color: theme.colors.text,
			fontSize: 20,
			fontFamily: "CustomFont-Regular",
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
