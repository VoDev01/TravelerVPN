import { getCode } from "country-list";
import { ServerRepository } from "../../db/repository/ServerRepository";
import { ServerEntity } from "../../db/schema/servers";
import { useBackendClient } from "./useBackendClient";

export function useServers() {
	const fetchServers = async (
		userId: string,
		tgId?: bigint,
	): Promise<ServerEntity[]> => {
		const { getSubscription, getGeoFromIp } = useBackendClient();
		try {
			const localServers = await ServerRepository.getAll();
			if (
				localServers &&
				localServers.length > 0 &&
				localServers.filter((s) => s.type == "traveler_vpn").length > 0
			) {
				return localServers;
			} else {
				const response = await getSubscription(userId, tgId ?? 0n);

				if (!response || !response.response) {
					throw new Error("Server didn't return any response.");
				}

				(response.response as any[]).forEach((r) => {
					getGeoFromIp(userId, r.inbound.shareAddr)
						.then((geo) => {
							ServerRepository.add({
								connectionLink: r.connectionLink,
								remark: r.inbound.remark,
								countryTag: getCode(geo?.response.country) ?? "US",
								inboundId: r.inbound.id,
								address: r.inbound.shareAddr,
								country: geo?.response.country,
								city: geo?.response.city,
								latitude: geo?.response.latitude,
								longitude: geo?.response.longitude,
							});
						})
						.catch((e) => {
							console.error(e);
						});
				});

				return await ServerRepository.getAll();
			}
		} catch (e) {
			console.error(e);
			return [];
		}
	};

	const refreshServers = async () => {
		try {
			await ServerRepository.deleteAll();
		} catch (e) {
			console.error(e);
		}
	};

	return {
		fetchServers,
		refreshServers,
		deleteServer: ServerRepository.delete,
		addServer: ServerRepository.add,
		getServerById: ServerRepository.getById,
	};
}
