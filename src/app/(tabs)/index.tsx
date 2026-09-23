import { CustomTheme } from "@/constants/theme";
import { useServerMap } from "@/context/ServerMapContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useDurationWatch } from "@/hooks/useDurationWatch";
import { useLibxray } from "@/hooks/useLibxray";
import { useServers } from "@/hooks/useServers";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

	const { setFrame, setIsConnecting, setConnectingServerId, selectedLocation } =
		useServerMap();

	const mapRef = useRef<View>(null);
	const isFocused = useIsFocused();

	const { t } = useTranslation();
	const theme = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const [connectionState, setConnectionState] = useState("DISCONNECTED");
	const { runXray, testXray, stopXray, getXrayState } = useLibxray();

	const serverIdRef = useRef<number | undefined>(undefined);
	const connectedAtRef = useRef<number | null>(null);
	const bootstrappedRef = useRef(false);
	const connectionStateRef = useRef<string>("DISCONNECTED");

	useEffect(() => {
		connectionStateRef.current = connectionState;
	}, [connectionState]);

	// Keep a ref to the active server id so the status listener (registered once)
	// can persist it when the tunnel reports CONNECTED.
	useEffect(() => {
		serverIdRef.current = server?.id;
	}, [server]);

	const persistActive = useCallback(async (serverId: number) => {
		const connectedAt = connectedAtRef.current ?? Date.now();
		connectedAtRef.current = connectedAt;
		try {
			await AsyncStorage.setItem(ACTIVE_SERVER_ID_KEY, String(serverId));
			await AsyncStorage.setItem(CONNECTED_AT_KEY, String(connectedAt));
		} catch (e) {
			console.error("Unable to persist active VPN session:", e);
		}
	}, []);

	const clearActive = useCallback(async () => {
		connectedAtRef.current = null;
		try {
			await AsyncStorage.removeItem(ACTIVE_SERVER_ID_KEY);
			await AsyncStorage.removeItem(CONNECTED_AT_KEY);
		} catch (e) {
			console.error("Unable to clear active VPN session:", e);
		}
	}, []);

	// Live transitions come from the native event stream (authoritative). Persist
	// the session on CONNECTED; clear it when the tunnel is down.
	useEffect(() => {
		const subscription = ExpoLibxray.addListener(
			"onVpnStatusChange",
			(event: VpnStatusEvent) => {
				setConnectionState(event.status);
				if (event.error) console.error(event.error);
				if (event.status === "CONNECTED") {
					if (serverIdRef.current != null) {
						persistActive(serverIdRef.current);
					}
				} else if (
					event.status === "DISCONNECTED" ||
					event.status === "ERROR"
				) {
					void clearActive();
				}
			},
		);

		return () => {
			subscription.remove();
		};
	}, [persistActive, clearActive]);

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

				// Fresh connect: anchor the timer to now until the CONNECTED event
				// confirms it (which also persists serverId + connectedAt).
				connectedAtRef.current = Date.now();

				runXray(selectedServer.connectionLink).catch((e) => {
					console.error(e);
				});

				setServer(selectedServer);
			})
			.catch((e) => {
				console.error(e);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedServerId]);

	// One-time cold-start bootstrap: if a tunnel is already running (e.g. the app
	// was killed while connected and no status event will replay), restore the
	// server + true elapsed timer. Guarded by a stored server id so a flaky
	// getXrayState() can never fabricate a connection.
	useEffect(() => {
		if (bootstrappedRef.current) {
			return;
		}
		bootstrappedRef.current = true;
		(async () => {
			try {
				const [running, storedServerId, storedConnectedAt] =
					await Promise.all([
						getXrayState(),
						AsyncStorage.getItem(ACTIVE_SERVER_ID_KEY),
						AsyncStorage.getItem(CONNECTED_AT_KEY),
					]);
				if (running && storedServerId) {
					connectedAtRef.current = Number(storedConnectedAt) || Date.now();
					const restored = await getServerById(+storedServerId);
					if (restored) {
						setServer(restored);
					}
					setConnectionState("CONNECTED");
				}
			} catch (e) {
				console.error("VPN bootstrap failed:", e);
			}
		})();
	}, [getXrayState, getServerById]);

	// Demote-only safety net for a tunnel that died without a DISCONNECTED event.
	// It never promotes, so it cannot re-create the "false connected after stop"
	// bug that the previous promote-on-poll introduced.
	useEffect(() => {
		if (!isFocused) {
			return;
		}
		const check = async () => {
			if (connectionStateRef.current !== "CONNECTED") {
				return;
			}
			try {
				const running = await getXrayState();
				if (!running) {
					await clearActive();
					setConnectionState("DISCONNECTED");
				}
			} catch (e) {
				console.error("Unable to read Xray state:", e);
			}
		};
		const interval = setInterval(check, 5000);
		return () => clearInterval(interval);
	}, [isFocused, getXrayState, clearActive]);

	// Timer runs while CONNECTED, seeded from the real connected-at so a restored
	// (post-restart) tunnel shows true elapsed time instead of restarting at 0.
	useEffect(() => {
		if (connectionState === "CONNECTED") {
			if (connectedAtRef.current == null) {
				connectedAtRef.current = Date.now();
			}
			const elapsed = Math.max(0, Date.now() - connectedAtRef.current);
			start(elapsed);
		} else if (connectionState === "DISCONNECTED") {
			reset();
		}
	}, [connectionState, start, reset]);

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
					// Layout can still be settling right after a redirect back to the
					// index tab; retry so the globe frame is never left unset.
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

			{/*
				The globe canvas is mounted once at the root layout and never
				unmounts. This placeholder only reserves the space and reports its
				window frame so the persistent canvas can be positioned here.
			*/}
			<View ref={mapRef} style={styles.mapContainer} onLayout={measureMap} />

			{connectionState === "CONNECTING" || connectionState === "CONNECTED" ? (
				<TouchableOpacity
					style={styles.disconnectButton}
					onPress={async () => {
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
							stillRunning = await getXrayState();
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
						await clearActive();
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
