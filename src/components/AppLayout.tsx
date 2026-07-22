import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/ThemeContext";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface AppLayoutProps {
	children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
	const theme = useAppTheme();
	const styles = createStyles(theme);
	return <View style={styles.container}>{children}</View>;
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.primary,
			padding: 24,
		},
	});
