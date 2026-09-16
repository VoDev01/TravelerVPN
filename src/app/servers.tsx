import { CustomTheme } from "@/constants/theme";
import { useBackendClient } from "@/hooks/useBackendClient";
import { useServers } from "@/hooks/useServers";
import { MetricsServerData } from "@/hooks/useWebSocketClient";
import { useAppTheme } from "@/ThemeContext";
import { appEmitter } from "@/utility/emitter";
import { useRouter } from "expo-router";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
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
}: {
	setSelectedServer: (id: number) => void;
	selectedServer: number | undefined;
}) {
	const [servers, setServers] = useState<MetricsServerSection[]>([]);

	const [isRefreshing, setIsRefreshing] = useState(true);

	const { fetchServers, refreshServers } = useServers();
	const { getSubscription } = useBackendClient();

	const theme = useAppTheme();
	const styles = createStyles(theme);

	const setServersAndMetrics = (userId: string) => {
		fetchServers(userId).then((data) => {
			if (data.length > 0) {
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
			}
		});
	};

	useEffect(() => {
		setIsRefreshing(true);

		SecureStore.getItemAsync("USER_ID").then((userId) => {
			if (userId) {
				setServersAndMetrics(userId);
			}
		});
	}, []);

	useEffect(() => {
		appEmitter.addListener("onChooseServerLocation", (id: number) => {
			setServers(
				servers.filter((server) => "id" in server && server.id === id),
			);
		});

		return () => {
			appEmitter.removeListener("onChooseServerLocation");
		};
	}, []);

	const onRefresh = () => {
		setIsRefreshing(true);
		try {
			refreshServers().then(() => {
				SecureStore.getItemAsync("USER_ID").then((userId) => {
					if (userId) {
						setServersAndMetrics(userId);
					}
				});
			});
		} catch (err) {
			console.error(err);
		}
	};

	const renderServer = ({ item }: { item: MetricsServerData }) => {
		const borderColor =
			item.id === selectedServer ? theme.colors.important2 : "#00000000";
		return (
			<TouchableOpacity
				style={[styles.serverRow, { borderColor }]}
				onPress={() => setSelectedServer(item.id)}>
				<View style={styles.serverInfo}>
					<Text style={styles.serverInfoFlag}>
						{item.countryTag
							.toUpperCase()
							.split("")
							.map((char) => 127397 + char.charCodeAt(0))}
					</Text>
					<Text style={styles.serverInfoText}>{item.remark}</Text>
					{item.metrics && (
						<Text style={styles.serverInfoText}>{item.metrics.latencyMs}</Text>
					)}
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

	return (
		<SectionList
			sections={servers}
			keyExtractor={(item) => item.id.toString()}
			renderItem={renderServer}
			renderSectionHeader={renderSectionHeader}
			ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
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
	const { t } = useTranslation();
	const router = useRouter();

	const theme = useAppTheme();
	const styles = createStyles(theme);
	const insets = useSafeAreaInsets();

	const headerHeight = useHeaderHeight();
	const paddingTop = headerHeight + 16;
	const paddingBottom = insets.bottom;

	return (
		<View style={[styles.container, { paddingTop, paddingBottom }]}>
			<Text style={styles.title}>{t("available_servers")}</Text>

			<ServersScreenContent
				setSelectedServer={setSelectedServer}
				selectedServer={selectedServer}
			/>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.button, styles.submitButton]}
					onPress={() => {
						if (selectedServer) {
							appEmitter.emit("onServerConnecting", selectedServer);
							router.navigate("/");
						} else console.error("No server selected");
					}}>
					<Text style={styles.buttonText}>{t("connect")}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			rowGap: 12,
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
			width: "50%",
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
			flex: 1,
			flexDirection: "row",
			justifyContent: "space-between",
		},
		serverInfoFlag: {
			fontSize: 16,
		},
		serverInfoText: {
			color: theme.colors.text,
			fontSize: 16,
			fontFamily: "CustomFont-Regular",
			overflow: "hidden",
			textOverflow: "ellipsis",
		},
		serversCategoryTitle: {
			color: theme.colors.text,
			fontSize: 20,
			marginBottom: 24,
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
