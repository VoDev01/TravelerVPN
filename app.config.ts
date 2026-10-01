import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,

	name: "TravelerVPN",
	slug: "TravelerVPN",
	version: "1.0.0",
	orientation: "portrait",
	icon: "./assets/images/app_icon.png",
	scheme: "travelervpn",
	userInterfaceStyle: "automatic",

	ios: {
		...config.ios,
		bundleIdentifier: "com.traveler.vpn",
	},

	android: {
		...config.android,
		predictiveBackGestureEnabled: false,
		package: "com.traveler.vpn",
		permissions: [
			"INTERNET",
			"FOREGROUND_SERVICE",
			"FOREGROUND_SERVICE_SYSTEM_EXEMPTED",
			"BIND_VPN_SERVICE",
			"POST_NOTIFICATIONS",
			"ACCESS_NETWORK_STATE",
			"ACCESS_WIFI_STATE",
		],
		allowBackup: true,
		adaptiveIcon: {
			foregroundImage: "./assets/images/adaptive-icon.png",
			backgroundColor: "#000000",
		},
	},

	extra: {
		backendBaseUrl: "https://traveler-vpn.com",
		backendWsUrl: "https://traveler-vpn.com/ws",
		subscriptionExpiryReminderDays: 2, // Days before expiry to fire the local reminder.
		testUserGeoIp: null, // Change to null or delete on release!
	},

	plugins: [
		"expo-router",
		"expo-sqlite",
		[
			"expo-secure-store",
			{
				configureAndroidBackup: true,
			},
		],
		[
			"expo-navigation-bar",
			{
				enforceContrast: true,
				hidden: false,
			},
		],
		[
			"expo-build-properties",
			{
				android: {
					usesCleartextTraffic: false, // Change to false or delete on release!
					enableMinifyInReleaseBuilds: true,
					enableShrinkResourcesInReleaseBuilds: true,
				},
			},
		],
		[
			"expo-splash-screen",
			{
				backgroundColor: "#000000",
				image: "./assets/images/app_icon.png",
				imageWidth: 160,
				resizeMode: "contain",
				dark: {
					image: "./assets/images/app_icon.png",
					backgroundColor: "#000000",
				},
			},
		],
		"./plugins/withPlugin.ts",
		"expo-font",
		"expo-asset",
		"expo-image",
		"expo-localization",
		"expo-web-browser",
		"expo-notifications",
	],

	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
});
