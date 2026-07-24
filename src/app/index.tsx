import EarthIcon from "@/assets/images/boxicons_globe.svg";
import GermanyIcon from "@/assets/images/emojione_flag-for-germany.svg";
import DownArrowIcon from "@/assets/images/line-md_arrow-down.svg";
import UpArrowIcon from "@/assets/images/line-md_arrow-up.svg";
import GasPumpIcon from "@/assets/images/osmic_fuel-14.svg";
import PlaneIcon from "@/assets/images/Plane.svg";
import LocationDialogue from "@/components/LocationDialogue";
import { CustomTheme } from "@/constants/theme";
import { useDurationWatch } from "@/hooks/useDurationWatch";
import { useServers } from "@/hooks/useServers";
import { useAppTheme } from "@/ThemeContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ServerEntity } from "../../db/schema/servers";

const enum ServerConnection {
	NOT_SELECTED,
	DISCONNECTED,
	SELECTED,
	CONNECTING,
	CONNECTED,
}

type ServerEntityConnection = {
	connectionState: ServerConnection;
	entity: ServerEntity | null;
};

export default function MainScreen() {
	const [serverSelectionDialogueVisible, setServerSelectionDialogueVisible] =
		useState(false);
	const { time, start, stop, formatTime, reset } = useDurationWatch();
	const [server, setServer] = useState<ServerEntityConnection>({
		connectionState: ServerConnection.NOT_SELECTED,
		entity: null,
	});

	const { t } = useTranslation();

	const theme = useAppTheme();
	const styles = createStyles(theme);

	const { getServerById } = useServers();

	return (
		<>
			<View style={styles.contentContainer}>
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
							{server.connectionState === ServerConnection.NOT_SELECTED
								? t("not_connected")
								: server.entity?.locationCountry}
						</Text>
						{server.connectionState === ServerConnection.NOT_SELECTED ? (
							<></>
						) : (
							<GermanyIcon width={32} height={32} />
						)}
					</View>
				</View>

				<TouchableOpacity
					style={styles.mapContainer}
					onPress={() => {
						reset();
						start();
						setServer({
							connectionState: ServerConnection.CONNECTING,
							entity: server.entity,
						});
					}}>
					<PlaneIcon width={108} height={48} />
					<EarthIcon width={240} height={240} />
				</TouchableOpacity>

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
						}}>
						<Text style={styles.disconnectButtonText}>{t("disconnect")}</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={styles.chooseServerButton}
						onPress={() => {
							setServerSelectionDialogueVisible(true);
						}}>
						<Text style={styles.chooseServerButtonText}>
							{t("choose_server")}
						</Text>
					</TouchableOpacity>
				)}
			</View>
			<View style={styles.trafficContainer}>
				<View style={styles.trafficStatusData}>
					<GasPumpIcon width={48} height={48} fill={"#c40"} />
					<Text style={styles.dataLabel}>4.5/5.0 GB</Text>
				</View>
				<View style={styles.trafficStatusBar}>
					<View style={styles.dataBarFill} />
				</View>
			</View>
			<LocationDialogue
				dialogueVisible={serverSelectionDialogueVisible}
				onClose={() => {
					setServerSelectionDialogueVisible(!serverSelectionDialogueVisible);
				}}
				onSelect={async (serverId: number) => {
					setServerSelectionDialogueVisible(!serverSelectionDialogueVisible);
					try {
						const serverEntity = await getServerById(serverId);

						if (serverEntity) {
							setServer({
								connectionState: ServerConnection.SELECTED,
								entity: serverEntity,
							});
						}
					} catch (e) {
						console.error(e);
					}
				}}
			/>
			)
		</>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		contentContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			gap: 15,
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
		},
		locationText: {
			color: theme.colors.text,
			fontSize: 18,
			marginTop: 4,
		},
		mapContainer: {
			alignItems: "center",
			marginBottom: 24,
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
			marginBottom: 30,
			borderWidth: 1,
			borderColor: theme.colors.important2,
		},
		disconnectButton: {
			borderRadius: 12,
			paddingVertical: 12,
			paddingHorizontal: 24,
			alignSelf: "center",
			marginBottom: 30,
			borderWidth: 1,
			borderColor: theme.colors.important1,
		},
		chooseServerButtonText: {
			color: theme.colors.important2,
			fontSize: 20,
		},
		disconnectButtonText: {
			color: theme.colors.important1,
			fontSize: 20,
		},
		trafficContainer: {
			marginTop: "auto",
			marginBottom: 24,
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
