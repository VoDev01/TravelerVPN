import { useAppTheme } from "@/ThemeContext";
import { CustomTheme } from "@/constants/theme";
import {
	ServerMetrics,
	useBackendClient,
	VpnResponse,
} from "@/hooks/useBackendClient";
import { useServers } from "@/hooks/useServers";
import { ActivationState, Client } from "@stomp/stompjs";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import SockJS from "sockjs-client";
import { ServerEntity } from "../../db/schema/servers";

type MetricsServerData = ServerEntity & {
	metrics: ServerMetrics | null;
};

type ServersDialogueProps = {
	dialogueVisible: boolean;
	onClose: () => void;
	onSelect: (serverId: number) => void;
	onServerResponse: () => Promise<VpnResponse | undefined>;
};

function ServersDialogueContent({
	onSelect,
	onServerResponse,
	wsConnect,
}: {
	onSelect: (id: number) => void;
	onServerResponse: () => Promise<VpnResponse | undefined>;
	wsConnect: (servers: MetricsServerData[]) => void;
}) {
	const [selectedServer, setSelectedServer] = useState<number>();
	const [isRefreshing, setIsRefreshing] = useState(true);
	const [servers, setServers] = useState<MetricsServerData[]>([]);
	const { fetchServers, refreshServers } = useServers();
	const { ws } = useBackendClient();

	const theme = useAppTheme();
	const styles = createStyle(theme);

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
		let isMounted = true;

		fetchServers(onServerResponse())
			.then((data) => {
				if (isMounted) {
					const renderData: MetricsServerData[] = [];
					data.forEach((server) => {
						renderData.push({
							...server,
							metrics: null,
						});
					});
					setServers(renderData);
					setIsRefreshing(false);
				}
			})
			.catch((err) => {
				console.error(err);
			});

		return () => {
			isMounted = false;
		};
	}, [fetchServers]);

	useEffect(() => {
		wsEstablishConnection();
		wsConnect(servers);
	}, []);

	const onRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refreshServers();
			await fetchServers(onServerResponse()).then((data) => {
				const renderData: MetricsServerData[] = [];
				data.forEach((server) => {
					renderData.push({
						...server,
						metrics: null,
					});
				});
				setServers(renderData);
			});
		} catch (err) {
			console.error(err);
		} finally {
			setIsRefreshing(false);
		}
	};

	const handlePress = (id: number) => {
		setSelectedServer(id);
		onSelect(id);
	};

	const renderServer = ({ item }: { item: MetricsServerData }) => {
		const borderColor =
			item.id === selectedServer ? theme.colors.important2 : "#00000000";
		return (
			<TouchableOpacity
				key={item.id}
				style={[styles.serverRow, { borderColor }]}
				onPress={() => handlePress(item.id)}>
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
					padding: 20,
					alignItems: "center",
					justifyContent: "center",
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

const ServersDialogue = (props: ServersDialogueProps) => {
	const [selectedServer, setSelectedServer] = useState<number>();
	const { t } = useTranslation();

	const theme = useAppTheme();
	const styles = createStyle(theme);

	const { wsLogout } = useBackendClient();

	const wsClose = useCallback(() => {
		const response = wsLogout();
		response.then((v) => {
			if (v?.status === "success") {
				console.info("Ws connection closed successfully");
				wsClientRef.current?.deactivate();
				wsClientRef.current = null;
			} else console.info(`Ws connection closed with an error: ${v?.message}`);
		});
	}, []);

	const [closeWs, setCloseWs] = useState(false);

	const wsClientRef = useRef<Client | null>(null);
	const [wsUrl, setWsUrl] = useState(
		process.env.EXPO_PUBLIC_BACKEND_WSURL ??
			"http://10.0.2.2:8080/ws" + "/data/metrics",
	);

	const wsConnect = (servers: MetricsServerData[]) => {
		if (wsClientRef.current?.state === ActivationState.ACTIVE) return;

		wsClientRef.current = new Client({
			webSocketFactory: () => new SockJS(wsUrl),
			debug: (str) => console.log("STOMP Log:", str),
			reconnectDelay: 5000,
			heartbeatIncoming: 4000,
			heartbeatOutgoing: 4000,
		});

		wsClientRef.current.onConnect = (frame) => {
			console.info("Ws connection opened");

			wsClientRef.current?.subscribe("/data/metrics", (message) => {
				try {
					const data = JSON.parse(message.body);
					if (data.type === "client_traffic") {
						(data.data as Array<any>).forEach((metric) => {
							servers
								.filter((v) => {
									v.inboundId == metric.inboundId;
								})
								.forEach((v) => {
									v.metrics = {
										latencyMs: metric.delay,
										status: metric.status,
									};
								});
						});
					}
				} catch (e) {
					console.error(e);
				}
			});

			SecureStore.getItemAsync("USER_ID").then((userId) => {
				wsClientRef.current?.publish({
					destination: "/app/metrics",
					body: JSON.stringify({
						type: "client_creds",
						data: { userId },
					}),
				});
			});
		};

		wsClientRef.current.onStompError = (frame) => {
			console.error(`STOMP Error: ${frame.headers["message"]}`);
			return () => {
				wsClientRef.current?.deactivate();
				wsClientRef.current = null;
			};
		};

		wsClientRef.current.onDisconnect = () => {
			console.info("Ws connection closed");
		};

		wsClientRef.current.activate();

		return () => {
			wsClientRef.current?.deactivate();
			wsClientRef.current = null;
		};
	};

	useEffect(() => {
		if (closeWs) {
			wsClose();
			setCloseWs(false);
		}
	}, [closeWs]);

	return (
		<Modal
			animationType="fade"
			transparent={true}
			backdropColor={"#272727"}
			visible={props.dialogueVisible}
			onRequestClose={props.onClose}>
			<TouchableWithoutFeedback onPress={props.onClose}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>{t("available_servers")}</Text>

						<View
							style={{
								flex: 1,
								justifyContent: "center",
							}}>
							<ServersDialogueContent
								onSelect={(id) => setSelectedServer(id)}
								onServerResponse={() => props.onServerResponse()}
								wsConnect={(servers) => wsConnect(servers)}
							/>
						</View>

						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={[styles.button, styles.cancelButton]}
								onPress={() => {
									props.onClose();
									setCloseWs(true);
								}}>
								<Text style={styles.buttonText}>{t("cancel")}</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.submitButton]}
								onPress={() =>
									selectedServer !== undefined
										? props.onSelect(selectedServer)
										: props.onClose
								}>
								<Text style={styles.buttonText}>{t("select")}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

export default ServersDialogue;

const createStyle = (theme: CustomTheme) =>
	StyleSheet.create({
		modalOverlay: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.8)",
			justifyContent: "center",
			alignItems: "center",
		},
		modalContainer: {
			width: "86%",
			height: 512,
			backgroundColor: theme.colors.card,
			borderRadius: 16,
			padding: 24,
			justifyContent: "space-between",
		},
		modalTitle: {
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
			justifyContent: "space-between",
			width: "100%",
		},
		button: {
			paddingHorizontal: 24,
			paddingVertical: 12,
			borderRadius: 12,
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
			fontWeight: "600",
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
			fontWeight: "600",
		},
	});
