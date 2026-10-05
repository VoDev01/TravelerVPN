import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { useSettings } from "@/hooks/useSettings";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import Toast from "react-native-toast-message";

interface VpnConsentModalProps {
	isVisible: boolean;
	onAccept: () => void;
	onClose: () => void; // Добавили новый проп для закрытия модалки
}

export default function VpnConsentModal({
	isVisible,
	onAccept,
	onClose,
}: VpnConsentModalProps) {
	const { settings } = useSettings();
	const { t } = useTranslation();

	const theme = useAppTheme();
	const styles = createStyles(theme);

	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

	const TOS_URL = Constants.expoConfig?.extra?.termsUrl + settings.localization;
	const PRIVACY_URL =
		Constants.expoConfig?.extra?.privacyUrl + settings.localization;

	const handleOpenLink = async (url: string) => {
		try {
			await WebBrowser.openBrowserAsync(url);
		} catch (error) {
			Toast.show({
				type: "error",
				text1: t("error") || "Error",
				text2: t("unable_to_open_page") || "Unable to open page.",
			});
		}
	};

	const isButtonEnabled = acceptedTerms && acceptedPrivacy;

	return (
		<Modal
			visible={isVisible}
			animationType="slide"
			transparent={true}
			onRequestClose={onClose}>
			<TouchableWithoutFeedback onPress={onClose}>
				<View style={styles.overlay}>
					<TouchableWithoutFeedback>
						<View style={styles.container}>
							<View style={styles.content}>
								<Text style={styles.title}>{t("consent_screen_title")}</Text>
								<Text style={styles.subtitle}>
									{t("consent_screen_description")}
								</Text>

								<TouchableOpacity
									style={styles.checkboxRow}
									activeOpacity={0.8}
									onPress={() => setAcceptedTerms(!acceptedTerms)}>
									<View
										style={[
											styles.checkbox,
											acceptedTerms && styles.checkboxChecked,
										]}>
										{acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
									</View>
									<Text style={styles.label}>
										{t("consent_screen_accept_label")}{" "}
										<Text
											style={styles.link}
											onPress={() => handleOpenLink(TOS_URL)}>
											{t("consent_screen_terms_label")}
										</Text>
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.checkboxRow}
									activeOpacity={0.8}
									onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}>
									<View
										style={[
											styles.checkbox,
											acceptedPrivacy && styles.checkboxChecked,
										]}>
										{acceptedPrivacy && <Text style={styles.checkmark}>✓</Text>}
									</View>
									<Text style={styles.label}>
										{t("consent_screen_aggree_label")}{" "}
										<Text
											style={styles.link}
											onPress={() => handleOpenLink(PRIVACY_URL)}>
											{t("consent_screen_privacy_label")}
										</Text>
									</Text>
								</TouchableOpacity>
							</View>

							<TouchableOpacity
								style={[
									styles.button,
									!isButtonEnabled && styles.buttonDisabled,
								]}
								disabled={!isButtonEnabled}
								onPress={onAccept}>
								<Text style={styles.buttonText}>{t("continue")}</Text>
							</TouchableOpacity>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		overlay: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.6)",
			justifyContent: "center",
			alignItems: "center",
			paddingHorizontal: 20,
		},
		container: {
			width: "100%",
			maxHeight: "80%",
			backgroundColor: theme.colors.primary,
			borderRadius: 16,
			paddingHorizontal: 24,
			paddingVertical: 30,
			justifyContent: "space-between",
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.3,
			shadowRadius: 5,
			elevation: 5,
		},
		content: {
			marginBottom: 24,
		},
		title: {
			fontSize: 22,
			fontWeight: "bold",
			color: theme.colors.text,
			marginBottom: 12,
			textAlign: "center",
		},
		subtitle: {
			fontSize: 14,
			color: "#666666",
			textAlign: "center",
			marginBottom: 32,
			lineHeight: 20,
		},
		checkboxRow: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: 20,
			paddingVertical: 4,
		},
		checkbox: {
			width: 22,
			height: 22,
			borderWidth: 2,
			borderColor: theme.colors.important1,
			borderRadius: 6,
			marginRight: 12,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: "#ffffff",
		},
		checkboxChecked: {
			borderColor: theme.colors.important2,
		},
		checkmark: {
			color: theme.colors.important2,
			fontSize: 14,
			fontWeight: "bold",
		},
		label: {
			flex: 1,
			fontSize: 14,
			color: theme.colors.text,
			lineHeight: 20,
		},
		link: {
			color: theme.colors.important2,
			fontWeight: "600",
		},
		button: {
			backgroundColor: theme.colors.important2,
			paddingVertical: 16,
			borderRadius: 12,
			alignItems: "center",
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 2,
		},
		buttonDisabled: {
			backgroundColor: theme.colors.tretiary,
			shadowOpacity: 0,
			elevation: 0,
		},
		buttonText: {
			color: theme.colors.background,
			fontSize: 16,
			fontWeight: "bold",
		},
	});
