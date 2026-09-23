import LeftArrowWhite from "@/assets/images/line-md_arrow-left-white.svg";
import LeftArrow from "@/assets/images/line-md_arrow-left.svg";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { CanvasErrorBoundary } from "@/components/CanvasErrorBoundary";
import { toastConfig } from "@/components/config/toastConfig";
import { Loader } from "@/components/Loader";
import InteractiveServerMap from "@/components/InteractiveServerMap";
import { ModelProvider } from "@/context/ModelContext";
import { ServerMapProvider } from "@/context/ServerMapContext";
import {
	ThemeProvider,
	useAppTheme,
	useAppThemeToggle,
} from "@/context/ThemeContext";
import { useSettings } from "@/hooks/useSettings";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useFonts } from "expo-font";
import { useLocales } from "expo-localization";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	LogBox,
	StatusBar,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {
	initialWindowMetrics,
	SafeAreaProvider,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { db } from "../../db/client";
import migrations from "../../drizzle/migrations";
import "../../i18n";

LogBox.ignoreLogs([
	"SafeAreaView has been deprecated and will be removed in a future release",
]);

SplashScreen.preventAutoHideAsync();

function LayoutContent() {
	const theme = useAppTheme();
	const { t } = useTranslation();
	const { updateSetting } = useSettings();
	const { themeName } = useAppThemeToggle();
	const systemLocale = useLocales()[0].languageCode;

	const [loaded, error] = useFonts({
		"Nunito-Regular": require("@/assets/fonts/Nunito-Regular.ttf"),
		"Nunito-Bold": require("@/assets/fonts/Nunito-Bold.ttf"),
		"Geist-Regular": require("@/assets/fonts/Geist-Regular.ttf"),
		"Geist-Bold": require("@/assets/fonts/Geist-Bold.ttf"),
	});

	const insets = useSafeAreaInsets();

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	useEffect(() => {
		if (systemLocale)
			updateSetting("localization", systemLocale !== "ru" ? "en" : "ru");
	}, [systemLocale]);

	const bottomInset = insets?.bottom ?? 0;

	const BASE_OFFSET = 16;
	const safeBottomOffset = bottomInset + BASE_OFFSET;

	if (!loaded && !error) {
		return <Loader loaderText={t("loader_fonts")} />;
	}

	return (
		<>
			<Stack
				screenOptions={{
					headerBackTitle: undefined,
					title: undefined,
					headerShadowVisible: false,
					contentStyle: {
						flex: 1,
						backgroundColor: theme.colors.primary,
						paddingTop: insets?.top,
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
						contentStyle: {
							padding: 24,
							backgroundColor: theme.colors.primary,
						},
						headerLeft: () => {
							const router = useRouter();

							return (
								<TouchableOpacity
									onPress={() => {
										router.back();
									}}>
									{themeName === "dark" ? (
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
				<Stack.Screen
					name="server-edit"
					options={{
						headerTitle: "",
						headerTransparent: true,
						contentStyle: {
							padding: 24,
							backgroundColor: theme.colors.primary,
						},
					}}
				/>
				<Stack.Screen
					name="split-tunneling"
					options={{
						headerTitle: "",
						headerTransparent: true,
						contentStyle: {
							padding: 24,
							backgroundColor: theme.colors.primary,
						},
					}}
				/>
			</Stack>
			{/*
				Globally mounted interactive globe. Rendered after <Stack> so it sits
				above every screen and is never unmounted while navigating the root
				navigator. Its visibility is driven by the index tab's measured frame,
				and it eases in via a short timer fade so it does not pop over a screen
				animation. The error boundary isolates any GL/render failure so it can
				never propagate to the router and force a NavigationContainer remount.
			*/}
			<CanvasErrorBoundary>
				<InteractiveServerMap />
			</CanvasErrorBoundary>
			<Toast
				config={toastConfig}
				position="bottom"
				bottomOffset={safeBottomOffset}
			/>
		</>
	);
}

function LoadingDatabase() {
	const theme = useAppTheme();

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				padding: 12,
				backgroundColor: theme.colors.primary,
			}}>
			<Text style={{ fontSize: 20, marginBottom: 10 }}>Loading Database</Text>
			<ActivityIndicator size="large" />
		</View>
	);
}

function ThemedSystemUI() {
	const theme = useAppTheme();
	const { themeName } = useAppThemeToggle();

	return (
		<StatusBar
			backgroundColor={theme.colors.primary}
			barStyle={themeName === "dark" ? "light-content" : "dark-content"}
		/>
	);
}

export default function Layout() {
	const { success, error } = useMigrations(db, migrations);

	if (error) {
		console.error(error);
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: 12,
				}}>
				<Text style={{ color: "red", fontSize: 16 }}>
					Unable to load app due to database error
				</Text>
			</View>
		);
	}

	if (!success) {
		return (
			<ThemeProvider>
				<LoadingDatabase />
			</ThemeProvider>
		);
	}

	return (
		<ThemeProvider>
			<ModelProvider>
				<SafeAreaProvider initialMetrics={initialWindowMetrics}>
					<ServerMapProvider>
						<LayoutContent />
					</ServerMapProvider>
					<AnimatedSplashOverlay />
					<ThemedSystemUI />
				</SafeAreaProvider>
			</ModelProvider>
		</ThemeProvider>
	);
}
