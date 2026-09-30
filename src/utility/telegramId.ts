import * as SecureStore from "expo-secure-store";

const TELEGRAM_ID_KEY = "@telegram_id";

export const getStoredTelegramId = async (): Promise<string> => {
	try {
		return (await SecureStore.getItemAsync(TELEGRAM_ID_KEY)) ?? "";
	} catch (error) {
		console.warn("Unable to read Telegram id", error);
		return "";
	}
};

export const setStoredTelegramId = async (value: string): Promise<void> => {
	try {
		const trimmed = value.trim();

		if (trimmed === "") {
			await SecureStore.deleteItemAsync(TELEGRAM_ID_KEY);
			return;
		}

		await SecureStore.setItemAsync(TELEGRAM_ID_KEY, trimmed);
	} catch (error) {
		console.warn("Unable to persist Telegram id", error);
	}
};
