import PlusIcon from "@/assets/images/akar-icons_plus.svg";
import HomeIcon from "@/assets/images/Home.svg";
import GearIcon from "@/assets/images/mdi_gear.svg";
import { useAppTheme } from "@/context/ThemeContext";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
	const theme = useAppTheme();
	const insets = useSafeAreaInsets();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,

				sceneStyle: {
					backgroundColor: theme.colors.primary,
					padding: 24,
				},

				tabBarStyle: {
					backgroundColor: theme.colors.card,
					marginBottom: insets.bottom,
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
			}}>
			<Tabs.Screen
				name="index"
				options={{
					tabBarIcon: ({ color }) => (
						<HomeIcon color={color} width={36} height={36} />
					),
				}}
			/>
			<Tabs.Screen
				name="addServers"
				options={{
					tabBarIcon: ({ color }) => (
						<PlusIcon color={color} width={36} height={36} />
					),
				}}
			/>
			<Tabs.Screen
				name="subscription"
				options={{
					tabBarIcon: ({ color }) => (
						<Text style={{ color, fontSize: 30, fontWeight: "700" }}>$</Text>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					tabBarIcon: ({ color }) => (
						<GearIcon color={color} width={36} height={36} />
					),
				}}
			/>
		</Tabs>
	);
}
