import { ServerRepository } from "../../db/repository/ServerRepository";
import { ServerEntity } from "../../db/schema/servers";
import { useBackendClient } from "./useBackendClient";

export function useServers() {
	const fetchServers = async (userId: string): Promise<ServerEntity[]> => {
		const { getSubscription } = useBackendClient();
		try {
			const localServers = await ServerRepository.getAll();
			if (localServers && localServers.length > 0) {
				return localServers;
			} else {
				const response = await getSubscription(userId);

				if (!response) {
					throw new Error("Server didn't return any response.");
				}

				(response.response as any[]).forEach((r) => {
					ServerRepository.add({
						connectionLink: r.connectionLink,
						remark: r.inbound.remark,
						contryTag: r.inbound.tag,
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
