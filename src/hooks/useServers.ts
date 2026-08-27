import { useCallback, useState } from "react";
import { ServerRepository } from "../../db/repository/ServerRepository";
import { ServerEntity } from "../../db/schema/servers";
import { VpnResponse } from "./useBackendClient";

export function useServers() {
	const [version, setVersion] = useState(0);

	async function processResponse(
		response: Promise<VpnResponse | undefined>,
	): Promise<ServerEntity[]> {
		if (typeof response !== "object" || !response) {
			throw new Error("Server didn't return any response.");
		}

		await response
			.then((v) => {
				try {
					if (!v || !v.response)
						throw new Error(
							`Unable to get inbounds for this client. Message: ${v?.message}`,
						);
					(v.response as Array<any>).forEach((r) => {
						ServerRepository.add({
							connectionLink: r.connectionLink,
							remark: r.inbound.remark,
							contryTag: r.inbound.tag,
						});
					});
				} catch (e) {
					console.error(e);
				}
			})
			.catch((e) => console.error(e));

		setVersion(0);

		return await ServerRepository.getAll();
	}

	const resolveServers = useCallback(
		async (
			response: Promise<VpnResponse | undefined>,
		): Promise<ServerEntity[]> => {
			const localServers = await ServerRepository.getAll();
			if (localServers && localServers.length > 0) {
				return localServers;
			} else {
				return await processResponse(response);
			}
		},
		[],
	);

	const refreshServers = useCallback(async () => {
		try {
			await ServerRepository.deleteAll();
			setVersion((prev) => prev + 1);
		} catch (e) {
			console.error(e);
		}
	}, []);

	return {
		fetchServers: resolveServers,
		refreshServers,
		deleteServer: ServerRepository.delete,
		addServer: ServerRepository.add,
		getServerById: ServerRepository.getById,
	};
}
