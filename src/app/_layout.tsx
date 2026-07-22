import HomeIcon from "@/assets/images/Home.svg";
import GearIcon from "@/assets/images/mdi_gear.svg";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppLayout from "@/components/AppLayout";
import { ThemeProvider, useAppTheme } from "@/ThemeContext";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { createBottomTabNavigator } from "expo-router/build/react-navigation/bottom-tabs";
import * as SplashScreen from "expo-splash-screen";
import { LogBox } from "react-native";
import MainScreen from ".";
import { db, expoDb } from "../../db/client";
import migrations from "../../drizzle/migrations";
import "../../i18n";
import SettingsScreen from "./settings";

LogBox.ignoreLogs([
	"SafeAreaView has been deprecated and will be removed in a future release",
]);

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

function LayoutContent() {
	const theme = useAppTheme();

	return (
		<AppLayout>
			<Tab.Navigator
				screenOptions={{
					headerShown: false,

					sceneStyle: {
						backgroundColor: theme.colors.primary,
					},

					tabBarStyle: {
						backgroundColor: theme.colors.card,
						borderRadius: 32,
						borderTopWidth: 0,
						paddingBottom: 0,
						overflow: "hidden",
						elevation: 0,
						justifyContent: "center",
						alignItems: "center",
					},

					tabBarShowLabel: false,
					tabBarActiveTintColor: theme.colors.important2,
					tabBarInactiveTintColor: theme.colors.secondary,

					tabBarIconStyle: {
						width: "100%",
						height: "100%",
						justifyContent: "center",
						alignItems: "center",
					},

					tabBarItemStyle: {
						paddingVertical: 8,
					},
				}}>
				<Tab.Screen
					name="Home"
					component={MainScreen}
					options={{
						tabBarIcon: ({ color }) => (
							<HomeIcon color={color} width={36} height={36} />
						),
					}}
				/>
				<Tab.Screen
					name="Settings"
					component={SettingsScreen}
					options={{
						tabBarIcon: ({ color }) => (
							<GearIcon color={color} width={36} height={36} />
						),
					}}
				/>
			</Tab.Navigator>
		</AppLayout>
	);
}

export default function Layout() {
	const { success } = useMigrations(db, {
		journal: {
			entries: [],
		},
		migrations: migrations.migrations,
	} as any);

	useDrizzleStudio(expoDb);

	return (
		<ThemeProvider>
			<AnimatedSplashOverlay />
			<LayoutContent />
		</ThemeProvider>
	);
}
