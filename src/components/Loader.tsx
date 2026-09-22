import { useAppTheme } from "@/context/ThemeContext";
import { ActivityIndicator, Text, View } from "react-native";

export function Loader({ loaderText }: { loaderText: string }) {
	const theme = useAppTheme();
	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="large" color={theme.colors.text} />
			<Text style={{ color: theme.colors.text, marginTop: 10 }}>
				{loaderText}
			</Text>
		</View>
	);
}
