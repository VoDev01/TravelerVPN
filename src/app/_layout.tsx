import LeftArrowWhite from "@/assets/images/line-md_arrow-left-white.svg";
import LeftArrow from "@/assets/images/line-md_arrow-left.svg";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { toastConfig } from "@/components/config/toastConfig";
import { Loader } from "@/components/Loader";
import { ModelProvider } from "@/context/ModelContext";
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
		"CustomFont-Regular": require("@/assets/fonts/Nunito-Regular.ttf"),
		"CustomFont-Bold": require("@/assets/fonts/Nunito-Bold.ttf"),
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
						},
					}}
				/>
			</Stack>
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
					<AnimatedSplashOverlay />
					<LayoutContent />
					<ThemedSystemUI />
				</SafeAreaProvider>
			</ModelProvider>
		</ThemeProvider>
	);
}
