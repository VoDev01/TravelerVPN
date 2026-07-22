import HomeIcon from "@/assets/images/Home.svg";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppLayout from "@/components/AppLayout";
import { ThemeProvider, useAppTheme } from "@/ThemeContext";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { createBottomTabNavigator } from "expo-router/build/react-navigation/bottom-tabs";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import MainScreen from ".";
import { db, expoDb, seedDatabase } from "../../db/client";
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
						height: 65,
						borderTopWidth: 0,
						paddingBottom: 0,
						overflow: "hidden",
						elevation: 0,
					},

					tabBarShowLabel: true,
					tabBarActiveTintColor: theme.colors.important2,
					tabBarInactiveTintColor: theme.colors.secondary,
					tabBarItemStyle: {
						paddingVertical: 8,
					},
				}}>
				<Tab.Screen
					name="Home"
					component={MainScreen}
					options={{
						title: "Home",
						tabBarIcon({ color, size }) {
							<HomeIcon color={color} width={size} height={size} />;
						},
					}}
				/>
				<Tab.Screen name="Settings" component={SettingsScreen} />
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

	useEffect(() => {
		async function initDb() {
			if (success) {
				await seedDatabase();
			}
		}
		initDb();
	}, [success]);

	return (
		<ThemeProvider>
			<AnimatedSplashOverlay />
			<LayoutContent />
		</ThemeProvider>
	);
}
