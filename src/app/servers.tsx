import { CustomTheme } from "@/constants/theme";
import { useBackendClient } from "@/hooks/useBackendClient";
import { useServers } from "@/hooks/useServers";
import {
	MetricsServerData,
	useWebSocketClient,
} from "@/hooks/useWebSocketClient";
import { useAppTheme } from "@/ThemeContext";
import { appEmitter } from "@/utility/emmiter";
import { useHeaderHeight } from "expo-router/build/react-navigation";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { ServerEntity } from "../../db/schema/servers";

function ServersScreenContent({
	wsConnect,
}: {
	wsConnect: (servers: MetricsServerData[]) => void;
}) {
	const [selectedServer, setSelectedServer] = useState<number>();
	const [isRefreshing, setIsRefreshing] = useState(true);
	const [servers, setServers] = useState<MetricsServerData[]>([]);
	const { fetchServers, refreshServers } = useServers();
	const { ws, getSubscription } = useBackendClient();

	const theme = useAppTheme();
	const styles = createStyles(theme);

	const wsEstablishConnection = useCallback(() => {
		const response = ws();
		response.then((v) => {
			if (v?.status === "success") {
				console.info("Ws connection authorized");
			} else {
				console.error("Could not establish ws connection");
			}
		});
	}, []);

	useEffect(() => {
		setIsRefreshing(true);

		appEmitter.addListener("onServersLoaded", (data: ServerEntity[]) => {
			const renderData: MetricsServerData[] = [];
			data.forEach((server) => {
				renderData.push({
					...server,
					metrics: null,
				});
			});
			setServers(renderData);
		});

		return () => {
			setIsRefreshing(false);
		};
	}, []);

	useEffect(() => {
		wsEstablishConnection();
		wsConnect(servers);
	}, []);

	const onRefresh = () => {
		setIsRefreshing(true);
		try {
			refreshServers().then(() => {
				SecureStore.getItemAsync("USER_ID").then((userId) => {
					if (userId) {
						getSubscription(userId).then((response) => {
							fetchServers(response?.response)
								.then((data) => {
									const renderData: MetricsServerData[] = [];
									data.forEach((server) => {
										renderData.push({
											...server,
											metrics: null,
										});
									});
									setServers(renderData);
								})
								.catch((err) => {
									console.error(err);
								});
						});
					}
				});
			});
		} catch (err) {
			console.error(err);
		} finally {
			setIsRefreshing(false);
		}
	};

	const renderServer = ({ item }: { item: MetricsServerData }) => {
		const borderColor =
			item.id === selectedServer ? theme.colors.important2 : "#00000000";
		return (
			<TouchableOpacity
				key={item.id}
				style={[styles.serverRow, { borderColor }]}
				onPress={() => setSelectedServer(item.id)}>
				<View style={styles.serverInfo}>
					<Text style={styles.serverInfoText}>{item.remark}</Text>
					<Text style={styles.serverInfoText}>{item.metrics?.latencyMs}</Text>
				</View>
			</TouchableOpacity>
		);
	};

	if (isRefreshing)
		return (
			<View
				style={{
					alignItems: "center",
				}}>
				<ActivityIndicator size="large" color={theme.colors.background} />
				<Text style={{ color: theme.colors.text, marginTop: 10 }}>
					Загрузка серверов...
				</Text>
			</View>
		);

	return (
		<FlatList
			data={servers}
			keyExtractor={(item) => item.id.toString()}
			renderItem={renderServer}
			ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					tintColor={theme.colors.background}
				/>
			}
		/>
	);
}

export default function ServersScreen() {
	const [selectedServer, setSelectedServer] = useState<number>();
	const { t } = useTranslation();

	const theme = useAppTheme();
	const styles = createStyles(theme);

	const { wsConnect } = useWebSocketClient();

	const headerHeight = useHeaderHeight();
	const paddingTop = headerHeight + 16;

	return (
		<View style={[styles.container, { paddingTop }]}>
			<Text style={styles.title}>{t("available_servers")}</Text>

			<View
				style={{
					flex: 1,
					justifyContent: "center",
				}}>
				<ServersScreenContent wsConnect={(servers) => wsConnect(servers)} />
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.button, styles.submitButton]}
					onPress={() => {
						if (selectedServer)
							appEmitter.emit("onServerConnecting", { id: selectedServer });
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
			paddingTop: 64,
			rowGap: 12,
		},
		navigation: {
			flex: 1,
			flexDirection: "row",
			justifyContent: "flex-start",
		},
		title: {
			color: theme.colors.secondary,
			fontSize: 20,
			fontWeight: "600",
			textAlign: "center",
			marginBottom: 24,
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
			color: "#000",
			fontSize: 16,
			fontFamily: "CustomFont-Regular",
		},
		serverRow: {
			flexDirection: "row",
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
			justifyContent: "space-around",
		},
		serverInfoText: {
			color: theme.colors.text,
			fontSize: 16,
			fontFamily: "CustomFont-Regular",
		},
	});
