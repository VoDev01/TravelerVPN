import LeftArrowWhite from "@/assets/images/line-md_arrow-left-white.svg";
import LeftArrow from "@/assets/images/line-md_arrow-left.svg";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { toastConfig } from "@/components/config/toastConfig";
import { Loader } from "@/components/Loader";
import { ModelProvider } from "@/context/ModelContext";
import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { useSettings } from "@/hooks/useSettings";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
	ActivityIndicator,
	LogBox,
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
	const { settings } = useSettings();

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

	const bottomInset = insets?.bottom ?? 0;

	const BASE_OFFSET = 16;
	const safeBottomOffset = bottomInset + BASE_OFFSET;

	if (!loaded && !error) {
		return <Loader loaderText="Loading fonts.." />;
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
				<Stack.Screen
					name="server-edit"
					options={{
						headerTitle: "",
						headerTransparent: true,
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
				</SafeAreaProvider>
			</ModelProvider>
		</ThemeProvider>
	);
}
