import { DarkTheme, LightTheme } from "@/constants/theme";
import { useSettings } from "./useSettings";

export function useAppTheme() {
	const { settings, isLoading } = useSettings();

	if (isLoading) {
		return DarkTheme;
	}

	return settings.theme === "dark" ? DarkTheme : LightTheme;
}
