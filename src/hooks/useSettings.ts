import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export interface SettingsState {
	theme: string;
	localization: string;
	connectionAlerts: boolean;
	dataUsageAlerts: boolean;
	securityWarnings: boolean;
	killSwitch: boolean;
	serverHoppingInterval: number;
	clientUuid: string;
}

const DEFAULT_SETTINGS: SettingsState = {
	theme: "dark",
	localization: "en",
	connectionAlerts: false,
	dataUsageAlerts: false,
	securityWarnings: false,
	killSwitch: false,
	serverHoppingInterval: 0,
	clientUuid: "",
};

const STORAGE_KEY = "@user_settings";

export const useSettings = () => {
	const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
				if (savedSettings) {
					setSettings(JSON.parse(savedSettings));
				}
			} catch (e) {
				console.log(`Error loading settings: ${e}`);
			} finally {
				setIsLoading(false);
			}
		};

		loadSettings();
	}, []);

	const updateSetting = async <K extends keyof SettingsState>(
		key: K,
		value: SettingsState[K],
	) => {
		try {
			const updatedSettings = { ...settings, [key]: value };

			setSettings(updatedSettings);

			AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
		} catch (e) {
			console.log(`Error saving setting [${key}]: ${e}`);
		}
	};

	return {
		settings,
		isLoading,
		updateSetting,
	};
};
