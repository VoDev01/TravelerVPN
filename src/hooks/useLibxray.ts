import { Paths } from "expo-file-system";
import ExpoLibxray, { LibxrayConfigBuilder } from "expo-libxray";
import i18n from "i18next";

const config = (initialConfig: string) => {
	const appFilesDir = Paths.document;
	return new LibxrayConfigBuilder(JSON.parse(initialConfig).data)
		.setLogging("warn")
		.setEnv(appFilesDir.uri.replace("file://", ""))
		.setInbounds([
			{
				tag: "SOCKS LOCAL",
				listen: "127.0.0.1",
				port: "10808",
				protocol: "socks",
				settings: {
					auth: "noauth",
					udp: true,
					ip: "127.0.0.1",
					userLevel: 0,
				},
				sniffing: {
					enabled: true,
					destOverride: ["http", "tls", "quic"],
				},
			},
		])
		.setOutbounds(
			[
				{
					tag: "VLESS TCP REALITY",
					sendThrough: "0.0.0.0",
				},
			],
			["streamSettings.realitySettings.port", "streamSettings.port"],
		)
		.setDns(
			{ "domain-!ru": ["8.8.8.8", "1.1.1.1"] },
			[
				"8.8.8.8",
				"1.1.1.1",
				{
					address: "8.8.8.8",
					port: 53,
					queryStrategy: "UseIPv4",
				},
				{
					address: "1.1.1.1",
					port: 53,
					queryStrategy: "UseIPv4",
				},
			],
			"UseIPv4",
		)
		.setRouting(
			[
				{
					type: "field",
					network: "tcp,udp",
					inboundTag: ["SOCKS LOCAL"],
					outboundTag: "VLESS TCP REALITY",
				},
				{
					type: "field",
					inboundTag: ["SOCKS LOCAL"],
					outboundTag: "dns-out",
					port: 53,
				},
				{
					type: "field",
					outboundTag: "block",
					inboundTag: ["SOCKS LOCAL"],
					protocol: ["bittorrent"],
				},
			],
			"AsIs",
		)
		.build();
};

const notificationContent = {
	title: i18n.t("notification_title"),
	content: i18n.t("notification_content"),
	statusConnected: i18n.t("notification_connected"),
	statusWaiting: i18n.t("notification_waiting"),
};

i18n.on("languageChanged", (lng) => {
	notificationContent.title = i18n.t("notification_title");
	notificationContent.content = i18n.t("notification_title");
	notificationContent.statusConnected = i18n.t("notification_connected");
	notificationContent.statusWaiting = i18n.t("notification_waiting");
});

export const useLibxray = () => {
	const initialConfig = (shareLink: string) =>
		ExpoLibxray.convertShareLinksToXrayJson(shareLink);

	const runXray = ExpoLibxray.runXray;

	const testXray = ExpoLibxray.testXray;

	const stopXray = ExpoLibxray.stopXray;

	const getXrayState = ExpoLibxray.getXrayState;

	const pingBatch = ExpoLibxray.pingBatch;

	const startXray = async (shareLink: string) => {
		initialConfig(shareLink).then((output) => {
			try {
				const result = runXray({
					xrayJson: config(output),
					appsSplitTunneling: undefined,
					vpnServiceErrorLocalized: "Vpn permission is rejected.",
					notificationErrorLocalized: "Vpn permission is rejected.",
					vpnServiceNotificationTitle: notificationContent.title,
					vpnServiceNotificationContent: notificationContent.content,
					vpnServiceNotificationStatus: {
						connected: notificationContent.statusConnected,
						waiting: notificationContent.statusWaiting,
						connecting: "Connecting...",
						error: "Internal service error",
					},
				});
				result.then((r) => {
					if (!r.success) throw new Error(r.error);
				});
			} catch (error) {
				console.error("Error starting Xray:", error);
				return false;
			}
		});
	};

	const convertShareLinksToJson = ExpoLibxray.convertShareLinksToXrayJson;

	const buildPingConfig = async (shareLink: string): Promise<string> => {
		const converted = await initialConfig(shareLink);
		const data = JSON.parse(converted).data;
		return typeof data === "string" ? data : JSON.stringify(data);
	};

	return {
		runXray: startXray,
		testXray,
		stopXray,
		getXrayState,
		pingBatch,
		convertShareLinksToJson,
		buildPingConfig,
	};
};
