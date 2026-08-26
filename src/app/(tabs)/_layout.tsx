import HomeIcon from "@/assets/images/Home.svg";
import GearIcon from "@/assets/images/mdi_gear.svg";
import { useAppTheme } from "@/ThemeContext";
import { createBottomTabNavigator } from "expo-router/build/react-navigation/bottom-tabs";
import MainScreen from ".";
import SettingsScreen from "./settings";

const Tab = createBottomTabNavigator();

export default function TabLayout() {
	const theme = useAppTheme();

	return (
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
	);
}
