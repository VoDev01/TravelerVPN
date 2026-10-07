import { getOrCreateUserId } from "@/utility/userId";
import Constants from "expo-constants";
import makeRequest from "../utility/api";

export interface VpnResponse {
	status: string;
	response: any;
	message?: string;
}

export interface ServerMetrics {
	latencyMs: bigint;
	status: string;
}

export interface GeoLocation {
	country: string;
	city: string;
	latitude: number;
	longitude: number;
}

export const useBackendClient = () => {
	const getSubscription = async (tgId: bigint) => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/user/subscription", "POST", {
				userId,
				tgId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error fetching subscription:", error);
		}
	};

	const createBillingCode = async () => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/billing/code", "POST", {
				userId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error creating billing code:", error);
		}
	};

	const getBillingStatus = async (code: string) => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/billing/status", "GET", {
				code,
				userId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error fetching billing status:", error);
		}
	};

	const getBillingPlans = async () => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/billing/plans", "GET", {
				userId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error fetching billing plans:", error);
		}
	};

	const getRenewalInvoice = async (existingCode?: string) => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/billing/renewal", "POST", {
				userId,
				...(existingCode ? { existingCode } : {}),
			})) as VpnResponse;
		} catch (error) {
			console.error("Error fetching renewal invoice:", error);
		}
	};

	const saveTelegramId = async (tgId: string) => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/user/telegram", "POST", {
				userId,
				tgId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error saving Telegram id:", error);
		}
	};

	const startRecovery = async (tgId: string) => {
		try {
			return (await makeRequest("/api/user/recover/start", "POST", {
				tgId,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error starting recovery:", error);
		}
	};

	const verifyRecovery = async (token: string) => {
		try {
			return (await makeRequest("/api/user/recover/verify", "GET", {
				token,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error verifying recovery:", error);
		}
	};

	const getUser = async () => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest(`/api/user`, "GET", { userId })) as VpnResponse;
		} catch (error) {
			console.error("Error fetching user:", error);
		}
	};

	const updateUser = async (client: any) => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest(
				`/api/user/update`,
				"PUT",
				{ userId },
				undefined,
				client,
			)) as VpnResponse;
		} catch (error) {
			console.error("Error updating user:", error);
		}
	};

	const getUserTraffic = async () => {
		try {
			const userId = await getOrCreateUserId();
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

	const detachInbounds = async (inbounds: number[]) => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/user/inbounds/detach", "POST", {
				userId,
				inbounds,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error detaching inbounds:", error);
		}
	};

	const attachInbounds = async (inbounds: number[]) => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/node/inbounds/attach", "POST", {
				userId,
				inbounds,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error attaching inbounds:", error);
		}
	};

	const getGeoFromIp = async (ip: string) => {
		try {
			const userId = await getOrCreateUserId();
			return (await makeRequest("/api/ip/geo", "POST", {
				userId,
				ip,
			})) as VpnResponse;
		} catch (error) {
			console.error("Error attaching inbounds:", error);
		}
	};

	const getUserGeoFromIp = async () => {
		try {
			const userId = await getOrCreateUserId();

			const testIpRaw = Constants.expoConfig?.extra?.testUserGeoIp;
			const testIpString =
				testIpRaw && typeof testIpRaw === "object"
					? JSON.stringify(testIpRaw)
					: String(testIpRaw);

			return (await makeRequest(
				"/api/ip/user/geo",
				"POST",
				{ userId },
				Constants.expoConfig?.extra?.testUserGeoIp
					? { "X-Forwarded-For": testIpString }
					: undefined,
			)) as VpnResponse;
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
		createBillingCode,
		detachInbounds,
		getBillingPlans,
		getBillingStatus,
		getRenewalInvoice,
		getSubscription,
		getUser,
		getUserTraffic,
		getGeoFromIp,
		getUserGeoFromIp,
		metrics,
		saveTelegramId,
		startRecovery,
		testNode,
		updateUser,
		verifyRecovery,
		ws,
		wsLogout,
	};
};
