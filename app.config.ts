import { ConfigContext, ExpoConfig } from "expo/config";
import "tsx/cjs";

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,

	name: "TravelerVPN",
	slug: "TravelerVPN",
	version: "1.1.1",
	orientation: "portrait",
	icon: "./assets/images/app_icon.png",
	scheme: "travelervpn",
	userInterfaceStyle: "automatic",
	owner: "vodev",
	backgroundColor: "#000000",

	ios: {
		...config.ios,
		bundleIdentifier: "com.traveler.vpn",
		icon: "./assets/images/app_icon.png",
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
		backendBaseUrl: "http://192.168.0.143",
		backendWsUrl: "http://192.168.0.143/ws",
		privacyUrl: "https://traveler-vpn.com/privacy/",
		termsUrl: "https://traveler-vpn.com/terms/",
		subscriptionExpiryReminderDays: 2, // Days before expiry to fire the local reminder.
		testUserGeoIp: "145.217.210.77", // Change to null or delete on release!
		eas: {
			projectId: "93b52c4c-aab5-4020-85e9-f916a32f0c7d",
		},
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
					usesCleartextTraffic: true, // Change to false or delete on release!
					enableMinifyInReleaseBuilds: true,
					enableShrinkResourcesInReleaseBuilds: true,
					extraProguardRules:
						"-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,MethodParameters,SourceFile,LineNumberTable\n\n# 1. Protect all JNI interactions (Critical for expo-gl and expo-libxray)\n-keepclasseswithmembernames,includedescriptorclasses class * {\n    native <methods>;\n}\n\n# 2. Complete exclusion for Expo core, its Views, and Modules\n-keep class expo.modules.** { *; }\n-keep class * extends expo.modules.kotlin.modules.Module { *; }\n-keep class * extends expo.modules.kotlin.views.ExpoView { *; }\n-keepclassmembers class * extends expo.modules.kotlin.modules.Module { <init>(...); }\n-keepclassmembers class * extends expo.modules.kotlin.views.ExpoView { <init>(...); }\n\n# 3. Specific rules for OpenGL / expo-gl\n-keep class com.expo.modules.gl.** { *; }\n-keep class expo.modules.gl.** { *; }\n-keepclassmembers class expo.modules.gl.GLView { *; }\n\n# 4. Protect Reanimated and Worklets (used in 3D animations)\n-keep class com.swmansion.reanimated.** { *; }\n-keep class com.swmansion.worklets.** { *; }\n\n# 5. Protect SQLite (required for Drizzle ORM)\n-keep class io.requery.android.database.** { *; }",
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
