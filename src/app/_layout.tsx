import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

import AppLayout from "@/components/AppLayout";
import { StyleSheet } from "react-native";

import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { LogBox } from "react-native";
import { db, expoDb, seedDatabase } from "../../db/client";
import migrations from "../../drizzle/migrations";
import "../../i18n";

LogBox.ignoreLogs([
	"SafeAreaView has been deprecated and will be removed in a future release",
]);

SplashScreen.preventAutoHideAsync();

export default function Layout() {
	const colorScheme = useColorScheme();

	const { success, error } = useMigrations(db, {
		journal: {
			entries: [],
		},
		migrations: migrations.migrations,
	} as any);

	useDrizzleStudio(expoDb);

	seedDatabase();

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<AnimatedSplashOverlay />
			<AppLayout>
				<Stack
					screenOptions={{
						contentStyle: {
							backgroundColor: "#1a1a1a",
						},
						headerShown: false,
					}}></Stack>
			</AppLayout>
		</ThemeProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
