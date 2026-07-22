import { useCallback, useMemo, useState } from "react";
import { ServerRepository } from "../../db/repository/ServerRepository";
import { ServerEntity } from "../../db/schema/servers";
import { useSettings } from "./useSettings";

interface VpnResponse {
	status: string;
	uuid: string;
	connectionLinks: Array<string>;
	message: string;
}

export function useServers() {
	const { settings, updateSetting } = useSettings();
	const [version, setVersion] = useState(0);

	async function processResponse(
		response: VpnResponse,
	): Promise<ServerEntity[]> {
		if (typeof response !== "object" || !response) {
			throw new Error("Server didn't return any response.");
		}
		updateSetting("clientUuid", response.uuid);

		await Promise.all(
			response.connectionLinks.map((link) =>
				ServerRepository.add({
					connectionLink: link,
					locationCountry: "local",
					ipv4: "127.0.0.1",
					ipv6: "::",
				}),
			),
		);

		setVersion(0);

		return await ServerRepository.getAll();
	}

	const serversPromise = useMemo(() => {
		return ServerRepository.getAll().then(async (localServers) => {
			const url = new URL(
				`${process.env.EXPO_PUBLIC_BACKEND_BASEURL}${process.env.EXPO_PUBLIC_BACKEND_CONNECTION_LINKS}`,
			);
			const formBody = new URLSearchParams({
				userId: settings.clientUuid || "",
			});

			try {
				const fetchRequest = fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
					},
					body: formBody.toString(),
				});

				const response = await fetchRequest;
				if (!response.ok)
					throw new Error(
						`Server responded with an error: ${response.statusText}`,
					);

				const json: VpnResponse = await response.json();

				console.debug(json);

				return await processResponse(json);
			} catch (e) {
				console.error(e);
			}
		});
	}, [settings.clientUuid, version]);

	const refreshServers = useCallback(async () => {
		try {
			await ServerRepository.deleteAll();
			setVersion((prev) => prev + 1);
		} catch (e) {
			console.error(e);
		}
	}, []);

	return {
		serversPromise,
		refreshServers,
		deleteServer: ServerRepository.delete,
		addServer: ServerRepository.add,
		getServerById: ServerRepository.getById,
	};
}
