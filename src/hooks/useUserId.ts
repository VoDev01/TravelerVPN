import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

const USER_ID_KEY = "USER_ID";

export const useUserId = () => {
	const [userId, setUserId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let isMounted = true;

		const initializeUser = async () => {
			try {
				let localId = await SecureStore.getItemAsync(USER_ID_KEY);

				if (isMounted) {
					setUserId(localId);
					setIsLoading(false);
				}
			} catch (err) {
				console.warn("Initialization failed, retrying on next mount", err);
				if (isMounted) {
					setError(err instanceof Error ? err : new Error("Unknown error"));
					setIsLoading(false);
				}
			}
		};

		initializeUser();

		return () => {
			isMounted = false;
		};
	}, []);

	return { userId, isLoading, error };
};
