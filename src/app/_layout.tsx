import LeftArrowWhite from "@/assets/images/line-md_arrow-left-white.svg";
import LeftArrow from "@/assets/images/line-md_arrow-left.svg";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useSettings } from "@/hooks/useSettings";
import { useWebSocketClient } from "@/hooks/useWebSocketClient";
import { ThemeProvider, useAppTheme } from "@/ThemeContext";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox, TouchableOpacity } from "react-native";
import { db } from "../../db/client";
import migrations from "../../drizzle/migrations";
import "../../i18n";

LogBox.ignoreLogs([
	"SafeAreaView has been deprecated and will be removed in a future release",
]);

SplashScreen.preventAutoHideAsync();

function LayoutContent() {
	const theme = useAppTheme();
	const { settings } = useSettings();

	const [closeWs, setCloseWs] = useState(false);
	const { wsClose } = useWebSocketClient();

	useEffect(() => {
		if (closeWs) {
			wsClose();
			setCloseWs(false);
		}
	}, [closeWs]);

	const [loaded, error] = useFonts({
		"CustomFont-Regular": require("@/assets/fonts/Nunito-Regular.ttf"),
		"CustomFont-Bold": require("@/assets/fonts/Nunito-Bold.ttf"),
	});

	useEffect(() => {
		if (closeWs) {
			wsClose();
			setCloseWs(false);
		}
	}, [closeWs]);

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	if (!loaded && !error) {
		return null;
	}

	return (
		<Stack
			screenOptions={{
				headerBackTitle: undefined,
				title: undefined,
				headerShadowVisible: false,
				contentStyle: {
					flex: 1,
					backgroundColor: theme.colors.primary,
					padding: 24,
				},
			}}>
			<Stack.Screen
				name="(tabs)"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="servers"
				options={{
					headerLeft: () => {
						const router = useRouter();

						return (
							<TouchableOpacity
								onPress={() => {
									router.back();
									setCloseWs(true);
								}}>
								{settings.theme === "dark" ? (
									<LeftArrowWhite width={48} height={48} />
								) : (
									<LeftArrow width={48} height={48} />
								)}
							</TouchableOpacity>
						);
					},
					headerTitle: "",
					headerTransparent: true,
				}}
			/>
		</Stack>
	);
}

export default function Layout() {
	const { success } = useMigrations(db, {
		journal: {
			entries: [],
		},
		migrations: migrations.migrations,
	} as any);

	return (
		<ThemeProvider>
			<AnimatedSplashOverlay />
			<LayoutContent />
		</ThemeProvider>
	);
}
