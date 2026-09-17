import { CustomTheme, DarkTheme, LightTheme } from "@/constants/theme";
import { SettingsState, useSettings } from "@/hooks/useSettings";
import React, { createContext, useContext } from "react";

interface ThemeContextData {
	theme: CustomTheme;
	updateSetting: <K extends keyof SettingsState>(
		key: K,
		value: SettingsState[K],
	) => Promise<void> | void;
	themeName: string;
}

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const { settings, isLoading, updateSetting } = useSettings();

	const theme = isLoading
		? DarkTheme
		: settings.theme === "dark"
			? DarkTheme
			: LightTheme;

	return (
		<ThemeContext.Provider
			value={{ theme, updateSetting, themeName: settings.theme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useAppTheme = () => {
	const context = useContext(ThemeContext);
	if (!context)
		throw new Error("useAppTheme must be used within ThemeProvider");
	return context.theme;
};

export const useAppThemeToggle = () => {
	const context = useContext(ThemeContext);
	if (!context)
		throw new Error("useAppThemeToggle must be used within ThemeProvider");
	return { themeName: context.themeName, updateTheme: context.updateSetting };
};
