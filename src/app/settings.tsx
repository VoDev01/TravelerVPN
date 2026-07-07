import ChevronDown from "@/assets/images/chevron_down.svg";
import ChevronUp from "@/assets/images/chevron_up.svg";
import { Locales } from "@/constants/locales";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useSettings } from "../hooks/useSettings";

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const { settings, isLoading, updateSetting } = useSettings();

	const [open, setOpen] = useState(false);
	const [language, setLanguage] = useState(settings.localization);
	const [languages, setLanguages] = useState(Locales);

	if (isLoading) {
		return <ActivityIndicator size="large" />;
	}

	return (
		<>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>{t("settings_title")}</Text>
			</View>
			<ScrollView style={styles.settingsContainer}>
				<View style={styles.settingGroup}>
					<Text style={styles.groupLabel}>{t("section_language")}</Text>
					<View style={styles.settingItem}>
						<Text style={styles.settingLabel}>{t("choose_language")}</Text>
						<DropDownPicker
							open={open}
							value={language}
							items={languages}
							setOpen={setOpen}
							setValue={(callback) => {
								const newValue =
									typeof callback === "function"
										? callback(language)
										: callback;

								if (newValue) {
									setLanguage(newValue);
									updateSetting("localization", newValue);
									i18n.changeLanguage(newValue);
								}
							}}
							setItems={setLanguages}
							listMode="SCROLLVIEW"
							style={{
								backgroundColor: "#000",
								borderColor: "transparent",
								minHeight: 40,
								width: 125,
							}}
							containerStyle={{
								width: 125,
								borderRadius: 12,
							}}
							dropDownContainerStyle={{
								backgroundColor: "#000",
								borderColor: "#3D3D3D",
								borderRadius: 12,
							}}
							textStyle={{
								color: "#FFFFFF",
								fontSize: 14,
							}}
							ArrowDownIconComponent={() => (
								<ChevronDown width={24} height={24} />
							)}
							ArrowUpIconComponent={() => <ChevronUp width={24} height={24} />}
							showTickIcon={false}
						/>
					</View>
				</View>

				<View style={styles.settingGroup}>
					<Text style={styles.groupLabel}>{t("section_notifications")}</Text>
					<View style={styles.settingItem}>
						<View style={styles.settingLabelRow}>
							<Text style={styles.settingLabel}>{t("connection_alerts")}</Text>
						</View>
						<Switch
							value={settings.connectionAlerts}
							onValueChange={(value) =>
								updateSetting("connectionAlerts", value)
							}
							trackColor={{ false: "#000", true: "#666" }}
							thumbColor={settings.connectionAlerts ? "#00ff00" : "#999"}
						/>
					</View>
					<View style={styles.settingItem}>
						<View style={styles.settingLabelRow}>
							<Text style={styles.settingLabel}>{t("data_usage_alerts")}</Text>
						</View>
						<Switch
							value={settings.dataUsageAlerts}
							onValueChange={(value) => updateSetting("dataUsageAlerts", value)}
							trackColor={{ false: "#000", true: "#666" }}
							thumbColor={settings.dataUsageAlerts ? "#00ff00" : "#999"}
						/>
					</View>
					<View style={styles.settingItem}>
						<View style={styles.settingLabelRow}>
							<Text style={styles.settingLabel}>{t("security_warnings")}</Text>
						</View>
						<Switch
							value={settings.securityWarnings}
							onValueChange={(value) =>
								updateSetting("securityWarnings", value)
							}
							trackColor={{ false: "#000", true: "#666" }}
							thumbColor={settings.securityWarnings ? "#00ff00" : "#999"}
						/>
					</View>
				</View>

				<View style={styles.settingGroup}>
					<Text style={styles.groupLabel}>{t("section_privacy")}</Text>
					<View style={styles.settingItem}>
						<View style={styles.settingLabelRow}>
							<Text style={styles.settingLabel}>{t("kill_switch")}</Text>
						</View>
						<Switch
							value={settings.killSwitch}
							onValueChange={(value) => updateSetting("killSwitch", value)}
							trackColor={{ false: "#000", true: "#999" }}
							thumbColor={settings.killSwitch ? "#00ff00" : "#999"}
						/>
					</View>
					<View style={styles.settingItem}>
						<View style={styles.settingLabelRow}>
							<Text style={styles.settingLabelFrag}>{t("server_hopping")}</Text>
							<View style={styles.settingContainerInput}>
								<Text style={styles.settingLabelFrag}>{t("every")}</Text>
								<TextInput
									value={
										settings.serverHoppingInterval === null
											? "0"
											: settings.serverHoppingInterval.toString()
									}
									onChangeText={(value) => {
										const cleaned = value.replace(/[^0-9]/g, "");
										const parsed =
											cleaned === "" ? 0 : Number.parseInt(cleaned, 10);

										updateSetting("serverHoppingInterval", parsed);
									}}
									style={styles.settingInput}
									inputMode="numeric"
									cursorColor={"#fff"}
									maxLength={4}
									selectionColor={"#000"}
								/>
								<Text style={styles.settingLabelFrag}>{t("minutes")}</Text>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
	settingsContainer: {
		flex: 1,
		rowGap: 12,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 30,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	backButtonText: {
		color: "#fff",
		fontSize: 24,
	},
	headerTitle: {
		color: "#fff",
		fontSize: 32,
	},
	settingGroup: {
		marginBottom: 28,
	},
	groupLabel: {
		color: "#ccc",
		fontSize: 20,
		marginBottom: 12,
	},
	settingItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.06)",
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 14,
		marginBottom: 12,
		width: "100%",
	},
	settingLabelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		flex: 1,
	},
	settingLabel: {
		color: "#ccc",
		fontSize: 16,
		flex: 1,
	},
	settingLabelFrag: {
		color: "#ccc",
		fontSize: 16,
	},
	languageSelect: {
		backgroundColor: "#969696",
		width: 48,
		height: 48,
		borderRadius: 12,
	},
	settingInput: {
		backgroundColor: "#000",
		borderRadius: 12,
		width: 60,
		color: "#fff",
		paddingHorizontal: 12,
	},
	settingContainerInput: {
		flexDirection: "row",
		flex: 1,
		alignItems: "center",
		columnGap: 12,
		justifyContent: "flex-end",
	},
});
