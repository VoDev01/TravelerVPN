import { Paths } from "expo-file-system";
import ExpoLibxray, {
	LibxrayConfigBuilder,
	RunXrayRequest,
	RunXrayResponse,
} from "expo-libxray";

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
			[
				"streamSettings.realitySettings.password",
				"streamSettings.realitySettings.port",
				"streamSettings.port",
				"streamSettings.xhttpSettings.xmux",
				"streamSettings.xhttpSettings.extra.xmux",
			],
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

export const useLibxray = () => {
	const initialConfig = (shareLink: string) =>
		ExpoLibxray.convertShareLinksToXrayJson(shareLink);

	const runXray: (request: RunXrayRequest) => Promise<RunXrayResponse> =
		ExpoLibxray.runXray;

	const testXray = (shareLink: string) => ExpoLibxray.testXray(shareLink);

	const stopXray = ExpoLibxray.stopXray;

	const pingBatch = ExpoLibxray.pingBatch;

	const startXray = async (shareLink: string) => {
		initialConfig(shareLink).then((output) => {
			try {
				const result = runXray({
					xrayJson: config(output),
					appsSplitTunneling: undefined,
					vpnServiceErrorLocalized: "Vpn permission is rejected.",
					notificationErrorLocalized: "Vpn permission is rejected.",
					vpnServiceNotificationTitle: "Vpn status",
					vpnServiceNotificationContent: "Status:",
					vpnServiceNotificationStatus: {
						connected: "Connected!",
						waiting: "Waiting...",
						error: "Internal Service Error",
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

	return {
		runXray: startXray,
		testXray,
		stopXray,
		pingBatch,
		convertShareLinksToJson,
	};
};
