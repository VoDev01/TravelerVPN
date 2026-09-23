import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const USER_ID_KEY = "USER_ID";
const USER_ID_BACKUP_KEY = "USER_ID_BACKUP";

let userIdPromise: Promise<string> | null = null;

const loadUserId = async () => {
	let secureId: string | null = null;
	let backupId: string | null = null;

	try {
		secureId = await SecureStore.getItemAsync(USER_ID_KEY);
	} catch (error) {
		console.warn("Unable to read USER_ID from SecureStore", error);
	}

	try {
		backupId = await AsyncStorage.getItem(USER_ID_BACKUP_KEY);
	} catch (error) {
		console.warn("Unable to read USER_ID backup", error);
	}

	if (secureId) {
		if (backupId !== secureId) {
			await AsyncStorage.setItem(USER_ID_BACKUP_KEY, secureId).catch((error) =>
				console.warn("Unable to update USER_ID backup", error),
			);
		}
		return secureId;
	}

	const userId = backupId ?? Crypto.randomUUID();

	await Promise.all([
		SecureStore.setItemAsync(USER_ID_KEY, userId).catch((error) =>
			console.warn("Unable to persist USER_ID to SecureStore", error),
		),
		AsyncStorage.setItem(USER_ID_BACKUP_KEY, userId).catch((error) =>
			console.warn("Unable to persist USER_ID backup", error),
		),
	]);

	return userId;
};

export const getOrCreateUserId = (): Promise<string> => {
	if (!userIdPromise) {
		userIdPromise = loadUserId().catch((error) => {
			userIdPromise = null;
			throw error;
		});
	}
	return userIdPromise;
};
