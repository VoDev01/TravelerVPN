import { getOrCreateUserId } from "@/utility/userId";
import { ActivationState, Client } from "@stomp/stompjs";
import { useRef, useState } from "react";
import SockJS from "sockjs-client";
import { ServerEntity } from "../../db/schema/servers";
import { ServerMetrics, useBackendClient } from "./useBackendClient";

export type MetricsServerData = ServerEntity & {
	metrics: ServerMetrics | null;
};

export const useWebSocketClient = () => {
	const { ws, wsLogout } = useBackendClient();

	const [wsLoggedin, setWsLoggedin] = useState(false);

	const wsClientRef = useRef<Client | null>(null);
	const [wsUrl] = useState(
		process.env.EXPO_PUBLIC_BACKEND_WSURL ?? "http://10.0.2.2:8080/ws",
	);

	const wsClose = () => {
		if (!wsLoggedin) return;

		const response = wsLogout();
		response.then((v) => {
			try {
				if (v?.status === "success") {
					console.info("Ws connection closed successfully");
				} else throw Error(`Ws connection closed with an error: ${v?.message}`);
			} catch (e) {
				console.error(e);
			}
		});

		wsClientRef.current?.deactivate();
		wsClientRef.current = null;
	};

	const clientTraffic = async (servers: MetricsServerData[]) => {
		if (!wsLoggedin) {
			ws()
				.then((response) => {
					setWsLoggedin(response?.status === "success");
				})
				.catch((e) => console.error(e));
		}

		if (
			wsClientRef.current?.state === ActivationState.ACTIVE ||
			wsClientRef.current?.state === ActivationState.DEACTIVATING
		)
			return;

		wsClientRef.current = new Client({
			webSocketFactory: () => new SockJS(wsUrl),
			debug: (str) => console.log("STOMP Log:", str),
			reconnectDelay: 5000,
		});

		const userId = await getOrCreateUserId();

		wsClientRef.current.onConnect = (frame) => {
			console.info("Ws connection opened");

			wsClientRef.current?.subscribe("/data/client/traffic", (message) => {
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

			wsClientRef.current?.publish({
				destination: "/data/client/traffic",
				body: JSON.stringify({
					type: "client_creds",
					data: userId,
				}),
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
	};

	return {
		clientTraffic,
		wsClose,
	};
};
