import { useCallback, useState } from "react";
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

		if (response.uuid && response.uuid !== settings.clientUuid) {
			updateSetting("clientUuid", response.uuid);
		}

		await Promise.all(
			response.connectionLinks.map((link) =>
				ServerRepository.add({
					connectionLink: link,
					locationCountry: "local",
					ipv4: "127.0.0.1",
					ipv6: "::",
				}),
			),
		).catch((e) => console.error(e));

		setVersion(0);

		return await ServerRepository.getAll();
	}

	const fetchServers = useCallback(async (): Promise<ServerEntity[]> => {
		const localServers = await ServerRepository.getAll();
		if (localServers && localServers.length > 0) {
			return localServers;
		}

		const url = `${process.env.EXPO_PUBLIC_BACKEND_BASEURL}${process.env.EXPO_PUBLIC_BACKEND_CONNECTION_LINKS}`;
		const formBody = new URLSearchParams();
		formBody.append("userId", settings.clientUuid || "");

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
			},
			body: formBody.toString(),
		});

		if (!response.ok)
			throw new Error(
				`Network response error: ${response.status} ${response.statusText}.`,
			);
		const json = await response.json();

		return await processResponse(json);
	}, [settings.clientUuid]);

	const connectToServer = useCallback(
		async (server: ServerEntity): Promise<boolean> => {
			// TODO: Implement native module with vpn client or use library
			return false;
		},
		[settings.clientUuid],
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
		fetchServers,
		connectToServer,
		refreshServers,
		deleteServer: ServerRepository.delete,
		addServer: ServerRepository.add,
		getServerById: ServerRepository.getById,
	};
}
