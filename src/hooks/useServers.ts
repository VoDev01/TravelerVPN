import { getCode } from "country-list";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { ServerRepository } from "../../db/repository/ServerRepository";
import { ServerEntity } from "../../db/schema/servers";
import { useBackendClient } from "./useBackendClient";
import { useLibxray } from "./useLibxray";

export function useServers() {
	const { t } = useTranslation();
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
						text1: t("toast_subscription_denied_text1"),
						text2: t("toast_subscription_denied_text2"),
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
				text1: t("toast_servers_error_text1"),
				text2: t("toast_servers_error_text2"),
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
