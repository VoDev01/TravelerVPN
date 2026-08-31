import GermanyIcon from "@/assets/images/emojione_flag-for-germany.svg";
import DownArrowIcon from "@/assets/images/line-md_arrow-down.svg";
import UpArrowIcon from "@/assets/images/line-md_arrow-up.svg";
import GasPumpIcon from "@/assets/images/osmic_fuel-14.svg";
import InteractiveServerMap from "@/components/InteractiveServerMap";
import { CustomTheme } from "@/constants/theme";
import { useDurationWatch } from "@/hooks/useDurationWatch";
import { useLibxray } from "@/hooks/useLibxray";
import { useServers } from "@/hooks/useServers";
import { useAppTheme } from "@/ThemeContext";
import { appEmitter } from "@/utility/emitter";
import * as Crypto from "expo-crypto";
import { Link } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { ServerEntity } from "../../../db/schema/servers";

const enum ServerConnection {
	DISCONNECTED,
	CONNECTING,
	CONNECTED,
}

type ServerEntityConnection = {
	connectionState: ServerConnection;
	entity: ServerEntity | null;
};

function Loader() {
	const theme = useAppTheme();

	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="large" color="#fff" />
			<Text style={{ color: theme.colors.text, marginTop: 10 }}>
				Загрузка карты...
			</Text>
		</View>
	);
}

export default function MainScreen() {
	const { time, start, stop, formatTime, reset } = useDurationWatch();
	const [server, setServer] = useState<ServerEntityConnection>({
		connectionState: ServerConnection.DISCONNECTED,
		entity: null,
	});
	const { getServerById } = useServers();

	const { t } = useTranslation();
	const theme = useAppTheme();
	const styles = createStyles(theme);

	const [userId, setUserId] = useState("");
	const { runXray, stopXray } = useLibxray();

	useEffect(() => {
		const userIdStorage = SecureStore.getItemAsync("USER_ID");
		userIdStorage.then((id) => {
			if (!id) {
				let generated = Crypto.randomUUID();
				SecureStore.setItemAsync("USER_ID", generated);
				setUserId(generated);
			} else {
				if (id != userId) setUserId(id);
			}
		});
	}, []);

	useEffect(() => {
		appEmitter.addListener("onServerConnecting", (id: number) => {
			getServerById(id).then((server: ServerEntity) => {
				setServer({
					connectionState: ServerConnection.CONNECTING,
					entity: server,
				});
				runXray(server.connectionLink)
					.then(() => {
						reset();
						start();
						setServer({
							connectionState: ServerConnection.CONNECTED,
							entity: server,
						});
					})
					.catch((e) => {
						console.error(e);
						setServer({
							connectionState: ServerConnection.DISCONNECTED,
							entity: server,
						});
					});
			});
		});
	}, []);

	return (
		<View style={styles.container}>
			<View style={styles.connectionStatus}>
				<View style={styles.speedContainer}>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>0.00 Mbps</Text>
						<DownArrowIcon width={24} height={24} />
					</View>

					<View style={styles.statItem}>
						<Text style={styles.statValue}>0.00 Mbps</Text>
						<UpArrowIcon width={24} height={24} />
					</View>
				</View>

				<Text style={styles.connectionDurationText}>{formatTime(time)}</Text>
				<View style={styles.locationData}>
					<Text style={styles.locationText}>
						{server.connectionState === ServerConnection.DISCONNECTED
							? t("not_connected")
							: server.entity?.remark}
					</Text>
					{server.connectionState === ServerConnection.DISCONNECTED ? (
						<></>
					) : (
						<GermanyIcon width={32} height={32} />
					)}
				</View>
			</View>

			<Suspense fallback={<Loader />}>
				<View style={styles.mapContainer}>
					<InteractiveServerMap />
				</View>
			</Suspense>

			{server.connectionState === ServerConnection.CONNECTED ||
			server.connectionState === ServerConnection.CONNECTING ? (
				<TouchableOpacity
					style={styles.disconnectButton}
					onPress={() => {
						reset();
						stop();
						setServer({
							connectionState: ServerConnection.DISCONNECTED,
							entity: server.entity,
						});
						stopXray();
					}}>
					<Text style={styles.disconnectButtonText}>{t("disconnect")}</Text>
				</TouchableOpacity>
			) : (
				<Link href="/servers" asChild>
					<TouchableOpacity
						style={styles.chooseServerButton}
						onPress={() => {}}>
						<Text style={styles.chooseServerButtonText}>
							{t("choose_server")}
						</Text>
					</TouchableOpacity>
				</Link>
			)}

			<View style={styles.trafficContainer}>
				<View style={styles.trafficStatusData}>
					<GasPumpIcon width={48} height={48} fill={"#c40"} />
					<Text style={styles.dataLabel}>4.5/5.0 GB</Text>
				</View>
				<View style={styles.trafficStatusBar}>
					<View style={styles.dataBarFill} />
				</View>
			</View>
		</View>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			rowGap: 12,
			paddingVertical: 24,
		},
		speedContainer: {
			flexDirection: "row",
			alignItems: "center",
			columnGap: 32,
		},
		statItem: {
			alignItems: "center",
			columnGap: 8,
			flexDirection: "row",
		},
		statValue: {
			color: theme.colors.text,
			fontSize: 18,
			fontFamily: "CustomFont-Regular",
		},
		statLabel: {
			color: "#888",
			fontSize: 12,
			marginTop: 4,
		},
		connectionStatus: {
			alignItems: "center",
			rowGap: 24,
			marginBottom: 24,
		},
		connectionDurationText: {
			color: theme.colors.text,
			fontSize: 18,
			marginTop: 4,
			fontFamily: "CustomFont-Regular",
		},
		locationText: {
			color: theme.colors.text,
			fontSize: 18,
			marginTop: 4,
			fontFamily: "CustomFont-Regular",
		},
		mapContainer: {
			alignItems: "center",
			marginBottom: 24,
			width: 350,
			height: 350,
		},
		locationData: {
			flexDirection: "row",
			columnGap: 24,
		},
		mapImage: {
			width: 150,
			height: 150,
		},
		chooseServerButton: {
			borderRadius: 12,
			paddingVertical: 12,
			paddingHorizontal: 24,
			alignSelf: "center",
			borderWidth: 1,
			borderColor: theme.colors.important2,
		},
		disconnectButton: {
			borderRadius: 12,
			paddingVertical: 12,
			paddingHorizontal: 24,
			alignSelf: "center",
			borderWidth: 1,
			borderColor: theme.colors.important1,
		},
		chooseServerButtonText: {
			color: theme.colors.important2,
			fontSize: 20,
			fontFamily: "CustomFont-Regular",
		},
		disconnectButtonText: {
			color: theme.colors.important1,
			fontSize: 20,
			fontFamily: "CustomFont-Regular",
		},
		trafficContainer: {
			marginTop: "auto",
		},
		trafficStatusData: {
			marginBottom: 10,
			columnGap: 24,
			flexDirection: "row",
			alignItems: "center",
		},
		dataIconImage: {
			width: 24,
			height: 24,
		},
		dataLabel: {
			color: theme.colors.text,
			fontSize: 18,
			marginBottom: 8,
			fontFamily: "CustomFont-Regular",
		},
		trafficStatusBar: {
			height: 12,
			backgroundColor: theme.colors.important2,
			alignItems: "flex-end",
			borderRadius: 12,
			overflow: "hidden",
		},
		dataBarFill: {
			height: "100%",
			backgroundColor: "#a6a6a6",
			width: "10%",
		},
	});
