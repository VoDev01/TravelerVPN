import { CustomTheme } from "@/constants/theme";
import { useServerMap } from "@/context/ServerMapContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useDurationWatch } from "@/hooks/useDurationWatch";
import { useLibxray } from "@/hooks/useLibxray";
import { useServers } from "@/hooks/useServers";
import ExpoLibxray from "expo-libxray";
import { VpnStatusEvent } from "expo-libxray/build/ExpoLibxrayModule";
import { Link, useIsFocused, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ServerEntity } from "../../../db/schema/servers";

const ACTIVE_SERVER_ID_KEY = "VPN_ACTIVE_SERVER_ID";
const CONNECTED_AT_KEY = "VPN_CONNECTED_AT";

export default function MainScreen() {
	const { time, start, stop, formatTime, reset } = useDurationWatch();

	const [server, setServer] = useState<ServerEntity | null>(null);
	const { getServerById } = useServers();

	const {
		setFrame,
		setIsConnecting,
		setConnectingServerId,
		selectedLocation,
		flightInProgress,
	} = useServerMap();

	const mapRef = useRef<View>(null);
	const isFocused = useIsFocused();

	const { t } = useTranslation();
	const theme = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const [connectionState, setConnectionState] = useState("DISCONNECTED");
	const [connectionStateText, setConnectionStateText] = useState(
		t("not_connected"),
	);
	const { runXray, stopXray, getXrayState } = useLibxray();

	const serverIdRef = useRef<number | undefined>(undefined);
	const connectLinkRef = useRef<string | null>(null);
	const pendingConnectRef = useRef(false);
	const wasFlightInProgressRef = useRef(false);
	const connectionStateRef = useRef<string>("DISCONNECTED");

	useEffect(() => {
		connectionStateRef.current = connectionState;
	}, [connectionState]);

	useEffect(() => {
		serverIdRef.current = server?.id;
	}, [server]);

	// Start the actual tunnel once the flight animation has landed. Guarded by
	// pendingConnectRef so it runs at most once per connect; a disconnect during the
	// animation clears that flag, so the tunnel is never started at all.
	const startPendingConnection = useCallback(() => {
		if (!pendingConnectRef.current) {
			return;
		}
		pendingConnectRef.current = false;
		const link = connectLinkRef.current;
		if (!link) {
			return;
		}
		connectLinkRef.current = null;
		runXray(link).catch((e) => {
			console.error("Failed to start Xray:", e);
			setConnectionState("ERROR");
		});
	}, [runXray]);

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

	const { selectedServerId, connectNonce } = useLocalSearchParams<{
		selectedServerId?: string;
		connectNonce?: string;
	}>();

	useEffect(() => {
		if (!selectedServerId) {
			return;
		}
		pendingConnectRef.current = true;
		setConnectionState("CONNECTING");
		getServerById(+selectedServerId)
			.then((selectedServer: ServerEntity | undefined) => {
				if (!selectedServer) {
					console.error(`Server with id ${selectedServerId} is not found`);
					pendingConnectRef.current = false;
					setConnectionState("DISCONNECTED");
					return;
				}
				// Stash the link and bind the server; the tunnel is started by
				// startPendingConnection() once the flight animation lands.
				connectLinkRef.current = selectedServer.connectionLink;
				setServer(selectedServer);
			})
			.catch((e) => {
				console.error(e);
				pendingConnectRef.current = false;
				setConnectionState("DISCONNECTED");
			});

		const fallback = setTimeout(() => startPendingConnection(), 15000);
		return () => clearTimeout(fallback);
	}, [selectedServerId, connectNonce]);

	useEffect(() => {
		const was = wasFlightInProgressRef.current;
		wasFlightInProgressRef.current = flightInProgress;
		if (was && !flightInProgress) {
			startPendingConnection();
		}
	}, [flightInProgress, startPendingConnection]);

	useEffect(() => {
		if (!isFocused) {
			return;
		}
		const check = async () => {
			if (
				pendingConnectRef.current ||
				connectionStateRef.current !== "CONNECTED"
			) {
				return;
			}
			try {
				const running = await getXrayState();
				if (!running) {
					setConnectionState("DISCONNECTED");
				}
			} catch (e) {
				console.error("Unable to read Xray state:", e);
			}
		};
		const interval = setInterval(check, 2500);
		return () => clearInterval(interval);
	}, [isFocused, getXrayState]);

	const displayState =
		connectionState === "CONNECTED" && flightInProgress
			? "CONNECTING"
			: connectionState;

	useEffect(() => {
		if (displayState === "CONNECTED") {
			start(0);
			setConnectionStateText(server?.remark ?? t("not_connected"));
		} else if (displayState === "DISCONNECTED") {
			reset();
			setConnectionStateText(t("not_connected"));
		} else {
			setConnectionStateText(t("connecting"));
		}
	}, [displayState, start, reset, server]);

	useEffect(() => {
		setIsConnecting(connectionState === "CONNECTING");
	}, [connectionState]);

	useEffect(() => {
		setConnectingServerId(server?.id);
	}, [server]);

	const measureMap = useCallback(() => {
		if (!isFocused) {
			return;
		}
		let attempts = 0;
		const run = () => {
			mapRef.current?.measureInWindow((x, y, width, height) => {
				if (width > 0 && height > 0) {
					setFrame({ x, y, width, height });
				} else if (attempts++ < 5) {
					requestAnimationFrame(run);
				}
			});
		};
		run();
	}, [isFocused, setFrame]);

	useEffect(() => {
		if (isFocused) {
			measureMap();
		} else {
			setFrame(null);
		}
	}, [isFocused, measureMap, setFrame]);

	return (
		<View style={styles.container}>
			<View style={styles.connectionStatus}>
				{/*<View style={styles.speedContainer}>
					<View style={styles.statItem}>
						<Text style={styles.statValue}>0.00 Mbps</Text>
						<DownArrowIcon width={24} height={24} />
					</View>

					<View style={styles.statItem}>
						<Text style={styles.statValue}>0.00 Mbps</Text>
						<UpArrowIcon width={24} height={24} />
					</View>
				</View>*/}

				<Text style={styles.connectionDurationText}>{formatTime(time)}</Text>
				<View style={styles.locationData}>
					<Text style={styles.locationText}>{connectionStateText}</Text>
					{displayState !== "DISCONNECTED" && server && (
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

			{/*
				The globe canvas is mounted once at the root layout and never
				unmounts. This placeholder only reserves the space and reports its
				window frame so the persistent canvas can be positioned here.
			*/}
			<View ref={mapRef} style={styles.mapContainer} onLayout={measureMap} />

			{displayState === "CONNECTING" || displayState === "CONNECTED" ? (
				<TouchableOpacity
					style={styles.disconnectButton}
					onPress={async () => {
						// Cancel the deferred connect so an aborted/finished flight can't start
						// the VPN service after the user has already disconnected.
						pendingConnectRef.current = false;
						connectLinkRef.current = null;
						setServer(null);
						reset();
						stop();
						try {
							await stopXray();
						} catch (e) {
							console.error("Failed to stop Xray:", e);
						}
						// Confirm the tunnel is actually down from the native source
						// (not the DISCONNECTED event, which may never fire) and retry once.
						let stillRunning = false;
						try {
							stillRunning = JSON.parse(await getXrayState()).data.running;
						} catch (e) {
							console.error("Unable to read Xray state:", e);
						}
						if (stillRunning) {
							try {
								await stopXray();
							} catch (e) {
								console.error("Failed to stop Xray on retry:", e);
							}
						}
						setConnectionState("DISCONNECTED");
					}}>
					<Text style={styles.disconnectButtonText}>{t("disconnect")}</Text>
				</TouchableOpacity>
			) : (
				<Link
					href={{
						pathname: "/servers",
						params: { city: selectedLocation ?? undefined },
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
			fontFamily: "Nunito-Regular",
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
			fontFamily: "Nunito-Regular",
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
			fontFamily: "Nunito-Regular",
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
			fontFamily: "Nunito-Regular",
		},
		disconnectButtonText: {
			color: theme.colors.important1,
			fontSize: 20,
			fontFamily: "Nunito-Regular",
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
			fontFamily: "Nunito-Regular",
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
