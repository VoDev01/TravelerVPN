import DownArrowIcon from "@/assets/images/line-md_arrow-down.svg";
import UpArrowIcon from "@/assets/images/line-md_arrow-up.svg";
import InteractiveServerMap from "@/components/InteractiveServerMap";
import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { useDurationWatch } from "@/hooks/useDurationWatch";
import { useLibxray } from "@/hooks/useLibxray";
import { useServers } from "@/hooks/useServers";
import ExpoLibxray from "expo-libxray";
import { VpnStatusEvent } from "expo-libxray/build/ExpoLibxrayModule";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ServerEntity } from "../../../db/schema/servers";

export default function MainScreen() {
	const { time, start, stop, formatTime, reset } = useDurationWatch();

	const [server, setServer] = useState<ServerEntity | null>(null);
	const [serversFilterLocation, setServersFilterLocation] = useState<
		string | null
	>();
	const { getServerById } = useServers();

	const { t } = useTranslation();
	const theme = useAppTheme();
	const styles = createStyles(theme);

	const [connectionState, setConnectionState] = useState("");
	const { runXray, testXray, stopXray } = useLibxray();

	useEffect(() => {
		const subscription = ExpoLibxray.addListener(
			"onVpnStatusChange",
			(event: VpnStatusEvent) => {
				setConnectionState(event.status);
				if (event.error) console.error(event.error);
			},
		);

		return () => {
			subscription.remove();
		};
	}, []);

	const { selectedServerId } = useLocalSearchParams<{
		selectedServerId?: string;
	}>();

	useEffect(() => {
		if (!selectedServerId) {
			return;
		}
		getServerById(+selectedServerId)
			.then((selectedServer: ServerEntity | undefined) => {
				if (!selectedServer) {
					console.error(`Server with id ${selectedServerId} is not found`);
					return;
				}

				runXray(selectedServer.connectionLink).catch((e) => {
					console.error(e);
				});

				setServer(selectedServer);
			})
			.catch((e) => {
				console.error(e);
			});
	}, [selectedServerId]);

	useEffect(() => {
		if (connectionState === "DISCONNECTED") {
			const timer = setTimeout(async () => {
				try {
					reset();
					stopXray();
					stop();
				} catch (e) {
					console.error("Error while stopping xray:", e);
				}
			}, 100);

			return () => clearTimeout(timer);
		} else if (connectionState === "CONNECTED") {
			reset();
			start();
		}
	}, [connectionState]);

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
						{connectionState === "DISCONNECTED"
							? t("not_connected")
							: server?.remark}
					</Text>
					{connectionState !== "DISCONNECTED" && server && (
						<Text style={styles.locationFlag}>
							{String.fromCodePoint(
								...server.countryTag
									.toUpperCase()
									.split("")
									.map((char) => 127397 + char.charCodeAt(0)),
							)}
						</Text>
					)}
				</View>
			</View>

			<View style={styles.mapContainer}>
				<InteractiveServerMap
					onSelectLocation={setServersFilterLocation}
					onServerConnectingId={server?.id}
					isVpnConnecting={connectionState === "CONNECTING"}
				/>
			</View>

			{connectionState === "CONNECTING" || connectionState === "CONNECTED" ? (
				<TouchableOpacity
					style={styles.disconnectButton}
					onPress={() => {
						setServer(null);
						setConnectionState("DISCONNECTED");
					}}>
					<Text style={styles.disconnectButtonText}>{t("disconnect")}</Text>
				</TouchableOpacity>
			) : (
				<Link
					href={{
						pathname: "/servers",
						params: { city: serversFilterLocation },
					}}
					asChild>
					<TouchableOpacity
						style={styles.chooseServerButton}
						onPress={() => {}}>
						<Text style={styles.chooseServerButtonText}>
							{t("choose_server")}
						</Text>
					</TouchableOpacity>
				</Link>
			)}

			{/*<View style={styles.trafficContainer}>
				<View style={styles.trafficStatusData}>
					<GasPumpIcon width={48} height={48} fill={"#c40"} />
					<Text style={styles.dataLabel}>4.5/5.0 GB</Text>
				</View>
				<View style={styles.trafficStatusBar}>
					<View style={styles.dataBarFill} />
				</View>
			</View> */}
		</View>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			rowGap: 12,
			paddingVertical: 24,
			justifyContent: "space-between",
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
		},
		connectionDurationText: {
			color: theme.colors.text,
			fontSize: 18,
			marginTop: 4,
			fontFamily: "CustomFont-Regular",
		},
		mapContainer: {
			width: "100%",
			aspectRatio: 1,
			justifyContent: "center",
			alignItems: "center",
			overflow: "hidden",
		},
		locationData: {
			flexDirection: "row",
			columnGap: 24,
			justifyContent: "center",
			alignItems: "center",
		},
		locationText: {
			color: theme.colors.text,
			fontSize: 18,
			marginTop: 4,
			fontFamily: "CustomFont-Regular",
		},
		locationFlag: {
			fontSize: 24,
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
