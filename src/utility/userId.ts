import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const USER_ID_KEY = "USER_ID";
const USER_ID_BACKUP_KEY = "USER_ID_BACKUP";

let userIdPromise: Promise<string> | null = null;

const generateAndroidUUID = async (androidId: string): Promise<string> => {
	const hash = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		androidId,
	);

	const p1 = hash.substring(0, 8);
	const p2 = hash.substring(8, 12);
	const p3 = hash.substring(12, 16);
	const p4 = hash.substring(16, 20);
	const p5 = hash.substring(20, 32);

	const uuidV4Block3 = "4" + p3.substring(1, 4);
	const uuidV4Block4 = "8" + p4.substring(1, 4);

	return `${p1}-${p2}-${uuidV4Block3}-${uuidV4Block4}-${p5}`;
};

const loadUserId = async (): Promise<string> => {
	let secureId: string | null = null;
	let backupId: string | null = null;

	try {
		[secureId, backupId] = await Promise.all([
			SecureStore.getItemAsync(USER_ID_KEY).catch(() => null),
			AsyncStorage.getItem(USER_ID_BACKUP_KEY).catch(() => null),
		]);
	} catch (error) {
		console.warn("Error reading storage during init", error);
	}

	let targetId = secureId || backupId;

	if (!targetId) {
		if (Platform.OS === "android") {
			try {
				const androidId = Application.getAndroidId();
				targetId = androidId
					? await generateAndroidUUID(androidId)
					: Crypto.randomUUID();
			} catch (e) {
				targetId = Crypto.randomUUID();
			}
		} else {
			targetId = Crypto.randomUUID();
		}
	}

	if (secureId !== targetId || backupId !== targetId) {
		await Promise.all([
			SecureStore.setItemAsync(USER_ID_KEY, targetId).catch((error) =>
				console.warn("Unable to sync USER_ID to SecureStore", error),
			),
			AsyncStorage.setItem(USER_ID_BACKUP_KEY, targetId).catch((error) =>
				console.warn("Unable to sync USER_ID backup", error),
			),
		]);
	}

	return targetId;
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

export const setUserId = async (id: string): Promise<void> => {
	const trimmed = id.trim();
	if (!trimmed) return;

	userIdPromise = Promise.resolve(trimmed);

	await Promise.all([
		SecureStore.setItemAsync(USER_ID_KEY, trimmed).catch((error) =>
			console.warn("Unable to persist USER_ID to SecureStore", error),
		),
		AsyncStorage.setItem(USER_ID_BACKUP_KEY, trimmed).catch((error) =>
			console.warn("Unable to persist USER_ID backup", error),
		),
	]);
};
