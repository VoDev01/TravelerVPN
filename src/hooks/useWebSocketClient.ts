import { ActivationState, Client } from "@stomp/stompjs";
import { useRef, useState } from "react";
import SockJS from "sockjs-client";
import { ServerEntity } from "../../db/schema/servers";
import { ServerMetrics, useBackendClient } from "./useBackendClient";

export type MetricsServerData = ServerEntity & {
	metrics: ServerMetrics | null;
};

export const useWebSocketClient = () => {
	const { wsLogout } = useBackendClient();

	const wsClientRef = useRef<Client | null>(null);
	const [wsUrl] = useState(
		process.env.EXPO_PUBLIC_BACKEND_WSURL ??
			"http://10.0.2.2:8080/ws" + "/data/metrics",
	);

	const wsClose = () => {
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

	const wsConnect = (servers: MetricsServerData[]) => {
		if (wsClientRef.current?.state === ActivationState.ACTIVE) return;

		wsClientRef.current = new Client({
			webSocketFactory: () => new SockJS(wsUrl),
			debug: (str) => console.log("STOMP Log:", str),
			reconnectDelay: 5000,
		});

		wsClientRef.current.onConnect = (frame) => {
			console.info("Ws connection opened");

			wsClientRef.current?.subscribe("/data/metrics", (message) => {
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
				destination: "/app/metrics",
				body: JSON.stringify({
					type: "client_creds",
					data: {},
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

		return () => {
			wsClientRef.current?.deactivate();
			wsClientRef.current = null;
		};
	};

	return {
		wsConnect,
		wsClose,
	};
};
