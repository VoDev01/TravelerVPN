/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";
import { DefaultTheme } from "expo-router";

import { Platform } from "react-native";

export interface CustomTheme {
	colors: {
		text: string;
		text_input: string;
		primary: string;
		background: string;
		secondary: string;
		tretiary: string;
		card: string;
		important1: string;
		important2: string;
		important3: string;
		map: string;
	};
}

export const LightTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		text: "#000000",
		text_input: "#fff",
		primary: "#fff",
		background: "#fff",
		secondary: "#fff",
		tretiary: "#969696",
		card: "#303030",
		important1: "#C40000",
		important2: "#00b90c",
		important3: "#d6bd00",
		map: "#E35336",
	},
} as CustomTheme;

export const DarkTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		text: "#fff",
		text_input: "#fff",
		primary: "#1a1a1a",
		background: "#000",
		secondary: "#fff",
		tretiary: "#969696",
		card: "#303030",
		important1: "#C40000",
		important2: "#00E50F",
		important3: "#F3D600",
		map: "#E35336",
	},
} as CustomTheme;

export type ThemeColor = keyof typeof LightTheme & keyof typeof DarkTheme;

export const Fonts = Platform.select({
	ios: {
		/** iOS `UIFontDescriptorSystemDesignDefault` */
		sans: "system-ui",
		/** iOS `UIFontDescriptorSystemDesignSerif` */
		serif: "ui-serif",
		/** iOS `UIFontDescriptorSystemDesignRounded` */
		rounded: "ui-rounded",
		/** iOS `UIFontDescriptorSystemDesignMonospaced` */
		mono: "ui-monospace",
	},
	default: {
		sans: "normal",
		serif: "serif",
		rounded: "normal",
		mono: "monospace",
	},
	web: {
		sans: "var(--font-display)",
		serif: "var(--font-serif)",
		rounded: "var(--font-rounded)",
		mono: "var(--font-mono)",
	},
});

export const Spacing = {
	half: 2,
	one: 4,
	two: 8,
	three: 16,
	four: 24,
	five: 32,
	six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
