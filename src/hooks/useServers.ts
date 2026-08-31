import { useCallback } from "react";
import { ServerRepository } from "../../db/repository/ServerRepository";
import { ServerEntity } from "../../db/schema/servers";

export function useServers() {
	const fetchServers = useCallback(
		async (response: any[]): Promise<ServerEntity[]> => {
			try {
				const localServers = await ServerRepository.getAll();
				if (localServers && localServers.length > 0) {
					return localServers;
				} else {
					if (response.length == 0 || !response) {
						throw new Error("Server didn't return any response.");
					}

					response.forEach((r) => {
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
		},
		[],
	);

	const refreshServers = useCallback(async () => {
		try {
			await ServerRepository.deleteAll();
		} catch (e) {
			console.error(e);
		}
	}, []);

	return {
		fetchServers,
		refreshServers,
		deleteServer: ServerRepository.delete,
		addServer: ServerRepository.add,
		getServerById: ServerRepository.getById,
	};
}
