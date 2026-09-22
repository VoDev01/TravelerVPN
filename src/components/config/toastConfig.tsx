import { BaseToast, ErrorToast, ToastConfig } from "react-native-toast-message";

export const toastConfig: ToastConfig = {
	success: (props) => (
		<BaseToast
			{...props}
			text1NumberOfLines={1}
			text2NumberOfLines={3}
			style={{
				height: "auto",
				minHeight: 60,
				borderLeftColor: "#000",
				backgroundColor: "#00E50F",
				borderRadius: 12,
			}}
			contentContainerStyle={{ padding: 15, height: "auto" }}
			text1Style={{
				fontSize: 16,
				color: "#000",
			}}
			text2Style={{
				fontSize: 14,
				color: "#000",
			}}
		/>
	),

	error: (props) => (
		<ErrorToast
			{...props}
			text1NumberOfLines={1}
			text2NumberOfLines={3}
			style={{
				height: "auto",
				minHeight: 60,
				borderLeftColor: "#000",
				backgroundColor: "#C40000",
				borderRadius: 12,
			}}
			contentContainerStyle={{ padding: 15, height: "auto" }}
			text1Style={{
				fontSize: 16,
				color: "#000",
			}}
			text2Style={{
				fontSize: 14,
				color: "#000",
			}}
		/>
	),

	info: (props) => (
		<BaseToast
			{...props}
			text1NumberOfLines={1}
			text2NumberOfLines={3}
			style={{
				height: "auto",
				minHeight: 60,
				borderLeftColor: "#2196F3",
				backgroundColor: "#2196F3",
				borderRadius: 12,
			}}
			contentContainerStyle={{ padding: 15, height: "auto" }}
			text1Style={{
				fontSize: 16,
				color: "#fff",
			}}
			text2Style={{
				fontSize: 14,
				color: "#fff",
			}}
		/>
	),
};
