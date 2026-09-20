import { useAppTheme } from "@/context/ThemeContext";
import { appEmitter } from "@/utility/emitter";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ToastHost() {
	const [message, setMessage] = useState("");
	const animation = useRef(new Animated.Value(0)).current;
	const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const insets = useSafeAreaInsets();
	const theme = useAppTheme();

	useEffect(() => {
		const show = (nextMessage: string) => {
			if (hideTimer.current) clearTimeout(hideTimer.current);
			setMessage(nextMessage);
			Animated.spring(animation, {
				toValue: 1,
				useNativeDriver: true,
			}).start();
			hideTimer.current = setTimeout(() => {
				Animated.timing(animation, {
					toValue: 0,
					duration: 180,
					useNativeDriver: true,
				}).start();
			}, 3500);
		};

		appEmitter.on("showToast", show);
		return () => {
			appEmitter.off("showToast", show);
			if (hideTimer.current) clearTimeout(hideTimer.current);
		};
	}, [animation]);

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.toast,
				{
					bottom: insets.bottom + 20,
					backgroundColor: theme.colors.card,
					opacity: animation,
					transform: [
						{
							translateY: animation.interpolate({
								inputRange: [0, 1],
								outputRange: [80, 0],
							}),
						},
					],
				},
			]}>
			<Text style={[styles.text, { color: theme.colors.secondary }]}>
				{message}
			</Text>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	toast: {
		position: "absolute",
		left: 24,
		right: 24,
		zIndex: 1000,
		elevation: 12,
		borderRadius: 14,
		paddingHorizontal: 18,
		paddingVertical: 14,
	},
	text: {
		fontFamily: "CustomFont-Regular",
		fontSize: 16,
		textAlign: "center",
	},
});
