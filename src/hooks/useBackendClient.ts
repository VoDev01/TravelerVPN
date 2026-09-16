import makeRequest from "../utility/api";

export interface VpnResponse {
	status: string;
	response: any;
	message?: string;
}

export interface ServerMetrics {
	latencyMs: number;
	status: string;
}

export interface GeoLocation {
	country: string;
	city: string;
	latitude: number;
	longitude: number;
}

export const useBackendClient = () => {
	const getSubscription = async (userId: string, tgId: bigint) => {
		try {
			return (await makeRequest("/api/user/subscription", "POST", {
				userId,
				tgId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error fetching subscription:", error);
		}
	};

	const getUser = async (userId: string) => {
		try {
			return (await makeRequest(`/api/user`, "GET", { userId })) as VpnResponse;
		} catch (error) {
			console.error("Error fetching user:", error);
		}
	};

	const updateUser = async (userId: string, client: any) => {
		try {
			return (await makeRequest(`/api/user/update`, "PUT", {
				userId,
				client,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error updating user:", error);
		}
	};

	const getUserTraffic = async (userId: string) => {
		try {
			return (await makeRequest(`/api/user/traffic`, "GET", {
				userId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error fetching user traffic:", error);
		}
	};

	const testNode = async (address: string, port: number, apiToken: string) => {
		try {
			return (await makeRequest("/api/node/test", "POST", {
				address,
				port,
				apiToken,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error testing node:", error);
		}
	};

	const detachInbounds = async (userId: string, inbounds: number[]) => {
		try {
			return (await makeRequest("/api/user/inbounds/detach", "POST", {
				userId,
				inbounds,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error detaching inbounds:", error);
		}
	};

	const attachInbounds = async (userId: string, inbounds: number[]) => {
		try {
			return (await makeRequest("/api/node/inbounds/attach", "POST", {
				userId,
				inbounds,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error attaching inbounds:", error);
		}
	};

	const getGeoFromIp = async (userId: string, ip: string) => {
		try {
			return (await makeRequest("/api/ip/geo", "POST", {
				userId,
				ip,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error attaching inbounds:", error);
		}
	};

	const getUserGeoFromIp = async (userId: string) => {
		try {
			return (await makeRequest("/api/ip/user/geo", "POST", {
				email: userId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error attaching inbounds:", error);
		}
	};

	const ws = async () => {
		try {
			return (await makeRequest("/api/ws", "GET")) as VpnResponse;
		} catch (error) {
			console.error("Error connecting to WebSocket:", error);
		}
	};

	const wsLogout = async () => {
		try {
			return (await makeRequest("/api/ws/logout", "GET")) as VpnResponse;
		} catch (error) {
			console.error("Error logging out of WebSocket:", error);
		}
	};

	const metrics = async () => {
		try {
			return (await makeRequest("/api/ws/metrics", "GET")) as VpnResponse;
		} catch (error) {
			console.error("Error fetching metrics:", error);
		}
	};

	return {
		attachInbounds,
		detachInbounds,
		getSubscription,
		getUser,
		getUserTraffic,
		getGeoFromIp,
		getUserGeoFromIp,
		metrics,
		testNode,
		updateUser,
		ws,
		wsLogout,
	};
};
