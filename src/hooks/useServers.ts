import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useState } from "react";
import { ServerRepository } from "../../db/repository/ServerRepository";

export function useServers() {
	const { data: servers, error } = useLiveQuery(
		ServerRepository.getServersQuery(),
	);
	const [isSyncing, setIsSyncing] = useState(false);

	useEffect(() => {
		async function initFetch() {
			setIsSyncing(true);
			try {
			} catch (e) {
				// Обработка ошибки сети
			} finally {
				setIsSyncing(false);
			}
		}
		initFetch();
	}, []);

	return {
		servers: servers ?? [],
		isLoading: !servers && !error,
		isSyncing,
		error: error?.message ?? null,
		deleteServer: ServerRepository.delete,
		addServer: ServerRepository.add,
		getServerById: ServerRepository.getById,
	};
}
