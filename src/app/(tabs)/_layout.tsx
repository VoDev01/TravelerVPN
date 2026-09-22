import PlusIcon from "@/assets/images/akar-icons_plus.svg";
import HomeIcon from "@/assets/images/Home.svg";
import GearIcon from "@/assets/images/mdi_gear.svg";
import { useAppTheme } from "@/context/ThemeContext";
import { createBottomTabNavigator } from "expo-router/build/react-navigation/bottom-tabs";
import { Text } from "react-native";
import MainScreen from ".";
import AddServers from "./addServers";
import SettingsScreen from "./settings";
import SubscriptionScreen from "./subscription";

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
					borderRadius: 12,
					marginBottom: 24,
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
				name="Add servers"
				component={AddServers}
				options={{
					tabBarIcon: ({ color }) => (
						<PlusIcon color={color} width={36} height={36} />
					),
				}}
			/>
			<Tab.Screen
				name="Subscription"
				component={SubscriptionScreen}
				options={{
					tabBarIcon: ({ color }) => (
						<Text style={{ color, fontSize: 30, fontWeight: "700" }}>$</Text>
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
