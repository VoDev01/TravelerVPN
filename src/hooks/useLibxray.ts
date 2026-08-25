import { Paths } from "expo-file-system";
import * as Xray from "expo-libxray";

export const useLibxray = () => {
	const runXray: (
		request: Xray.RunXrayRequest,
	) => Promise<Xray.RunXrayResponse> = Xray.default.runXray;
	const stopXray: () => Promise<boolean> = Xray.default.stopXray;

	const startXray = async (shareLink: string) => {
		const appFilesDir = Paths.document;
		const initialConfig = Xray.default.convertShareLinksToXrayJson(shareLink);
		initialConfig.then((input) => {
			try {
				const config = new Xray.LibxrayConfigBuilder(JSON.parse(input).data)
					.setLogging("debug")
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
								domain: ["geosite:category-ads-all"],
								inboundTag: ["SOCKS LOCAL"],
								outboundTag: "block",
							},
							{
								type: "field",
								outboundTag: "direct",
								inboundTag: ["SOCKS LOCAL"],
								protocol: ["bittorrent"],
							},
							{
								type: "field",
								domain: ["geosite:ru-available-only-inside"],
								inboundTag: ["SOCKS LOCAL"],
								outboundTag: "direct",
							},
						],
						"AsIs",
					)
					.build();

				const result = runXray({
					xrayJson: config,
					geoIpUrl: undefined,
					geoSiteUrl: undefined,
					downloadEvery: "1",
					timeUnit: Xray.TimeUnit.HOURS,
					maxGeoAgeMillis: undefined,
					vpnServiceErrorLocalized: "Vpn permission is rejected.",
					notificationErrorLocalized: "Vpn permission is rejected.",
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

	return {
		runXray: startXray,
		stopXray,
	};
};
