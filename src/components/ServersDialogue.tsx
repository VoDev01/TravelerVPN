import { useAppTheme } from "@/ThemeContext";
import { CustomTheme } from "@/constants/theme";
import { useBackendClient, VpnResponse } from "@/hooks/useBackendClient";
import { useServers } from "@/hooks/useServers";
import {
	MetricsServerData,
	useWebSocketClient,
} from "@/hooks/useWebSocketClient";
import { useCallback, useEffect, useState } from "react";
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

	const [closeWs, setCloseWs] = useState(false);
	const { wsClose, wsConnect } = useWebSocketClient();

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
