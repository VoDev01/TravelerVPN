import { getCode } from "country-list";
import Toast from "react-native-toast-message";
import { ServerRepository } from "../../db/repository/ServerRepository";
import { ServerEntity } from "../../db/schema/servers";
import { useBackendClient } from "./useBackendClient";
import { useLibxray } from "./useLibxray";

export function useServers() {
	const fetchServers = async (tgId?: bigint): Promise<ServerEntity[]> => {
		const { getSubscription, getGeoFromIp } = useBackendClient();
		const { convertShareLinksToJson } = useLibxray();

		try {
			const localServers = await ServerRepository.getAll();
			if (localServers && localServers.length > 0) {
				return localServers;
			} else {
				const response = await getSubscription(tgId ?? 0n);

				if (response && response.status === "denied") {
					Toast.show({
						type: "info",
						text1: "Denied access to servers",
						text2: "Start using TravelerVPN servers by buying a subcription",
					});
					return [];
				} else if (!response || !response.response) {
					throw new Error("Server didn't return any response.");
				}

				await Promise.all(
					(response.response as any[]).map(async (r) => {
						try {
							const linkJson = await convertShareLinksToJson(r.connectionLink);
							const linkObj = JSON.parse(linkJson);
							const address = linkObj.data.outbounds[0].settings.address;
							const geo = await getGeoFromIp(address);
							console.log(1);
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
								type: "traveler_vpn",
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

			Toast.show({
				type: "error",
				text1: "Unable to reach TravelerVPN servers",
				text2: "Check your internet connection or report this issue.",
			});
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
