import { getCode } from "country-list";
import { ServerRepository } from "../../db/repository/ServerRepository";
import { ServerEntity } from "../../db/schema/servers";
import { useBackendClient } from "./useBackendClient";
import { useLibxray } from "./useLibxray";

export function useServers() {
	const fetchServers = async (
		userId: string,
		tgId?: bigint,
	): Promise<ServerEntity[]> => {
		const { getSubscription, getGeoFromIp } = useBackendClient();
		const { convertShareLinksToJson } = useLibxray();

		try {
			const localServers = await ServerRepository.getAll();
			if (
				localServers &&
				localServers.length > 0 &&
				localServers.filter((s) => s.type == "traveler_vpn").length > 0
			) {
				return localServers;
			} else {
				const response = await getSubscription(tgId ?? 0n);

				if (!response || !response.response) {
					throw new Error("Server didn't return any response.");
				}

				await Promise.all(
					(response.response as any[]).map(async (r) => {
						try {
							const linkJson = await convertShareLinksToJson(r.connectionLink);
							const linkObj = JSON.parse(linkJson);
							const address = linkObj.data.outbounds[0].settings.address;
							const geo = await getGeoFromIp(address);
							await ServerRepository.add({
								connectionLink: r.connectionLink,
								remark: r.inbound.remark,
								countryTag: getCode(geo?.response.country) ?? "US",
								inboundId: r.inbound.id,
								address,
								country: geo?.response.country,
								city: geo?.response.city,
								latitude: geo?.response.latitude,
								longitude: geo?.response.longitude,
							});
						} catch (error) {
							console.error(error);
						}
					}),
				);

				return await ServerRepository.getAll();
			}
		} catch (e) {
			console.error(e);
			return [];
		}
	};

	const refreshServers = async () => {
		await ServerRepository.deleteManaged();
	};

	return {
		fetchServers,
		refreshServers,
		deleteServer: ServerRepository.delete,
		deleteUserServers: ServerRepository.deleteUserDefined,
		addServer: ServerRepository.add,
		getServerById: ServerRepository.getById,
		updateServer: ServerRepository.update,
	};
}
