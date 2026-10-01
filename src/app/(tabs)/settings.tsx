import SunIcon from "@/assets/images/bi_sun.svg";
import ChevronDown from "@/assets/images/chevron_down.svg";
import ChevronUp from "@/assets/images/chevron_up.svg";
import MoonIcon from "@/assets/images/tabler_moon-filled.svg";
import { Locales } from "@/constants/locales";
import { CustomTheme } from "@/constants/theme";
import { useAppTheme, useAppThemeToggle } from "@/context/ThemeContext";
import { useBackendClient } from "@/hooks/useBackendClient";
import { UserPlan, VpnUser } from "@/types/VpnUser";
import { getStoredTelegramId, setStoredTelegramId } from "@/utility/telegramId";
import { getOrCreateUserId, setUserId } from "@/utility/userId";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";
import { useSettings } from "../../hooks/useSettings";

const RECOVERY_POLL_MS = 3000;
const RECOVERY_MAX_POLLS = 40;

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const { settings, isLoading, updateSetting } = useSettings();

	const {
		getUser,
		saveTelegramId: saveTelegramIdRemote,
		startRecovery,
		verifyRecovery,
	} = useBackendClient();

	const [subscriptionText, setSubscriptionText] = useState<string | null>(null);
	const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

	const [open, setOpen] = useState(false);
	const [language, setLanguage] = useState(settings.localization);
	const [languages, setLanguages] = useState(Locales);
	const [userId, setUserIdState] = useState("");
	const [tgId, setTgId] = useState("");
	const [isRecovering, setIsRecovering] = useState(false);

	const recoveryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const theme = useAppTheme();
	const { themeName, updateTheme } = useAppThemeToggle();
	const styles = useMemo(() => createStyles(theme), [theme]);

	useEffect(() => {
		setLanguage(settings.localization);
	}, [settings.localization]);

	useEffect(() => {
		getOrCreateUserId().then(setUserIdState);
		getStoredTelegramId().then(setTgId);
	}, []);

	const stopRecoveryPolling = useCallback(() => {
		if (recoveryPollRef.current) {
			clearInterval(recoveryPollRef.current);
			recoveryPollRef.current = null;
		}
	}, []);

	useEffect(() => stopRecoveryPolling, [stopRecoveryPolling]);

	const loadSubscription = useCallback(async () => {
		try {
			const response = await getUser();
			if (
				response?.status === "success" &&
				response.response &&
				typeof response.response === "object"
			) {
				const user = response.response as VpnUser;
				setSubscriptionText(
					user.plan === UserPlan.BUSINESS
						? t("account_business")
						: t("account_free"),
				);
			} else {
				setSubscriptionText(t("account_free"));
			}
		} catch {
			setSubscriptionText(t("account_free"));
		} finally {
			setIsLoadingSubscription(false);
		}
	}, [t]);

	useFocusEffect(
		useCallback(() => {
			loadSubscription();
		}, [loadSubscription]),
	);

	const copyUserId = async () => {
		if (!userId) return;
		await Clipboard.setStringAsync(userId);
		Toast.show({ type: "success", text1: t("account_copied") });
	};

	const saveTelegramId = async () => {
		const cleaned = tgId.replace(/[^0-9]/g, "").trim();
		setTgId(cleaned);
		await setStoredTelegramId(cleaned);

		if (cleaned) {
			const result = await saveTelegramIdRemote(cleaned);
			if (result?.status !== "success") {
				Toast.show({
					type: "error",
					text1: result?.message ?? t("telegram_id_save_failed"),
				});
				return;
			}
		}

		Toast.show({ type: "success", text1: t("telegram_id_saved") });
	};

	const handleRestore = async () => {
		const cleaned = tgId.replace(/[^0-9]/g, "").trim();
		if (!cleaned) {
			Toast.show({ type: "info", text1: t("recovery_tg_required") });
			return;
		}

		setIsRecovering(true);
		stopRecoveryPolling();

		try {
			const start = await startRecovery(cleaned);
			const token = start?.response?.token as string | undefined;
			const deepLink = start?.response?.deepLink as string | undefined;

			if (start?.status !== "success" || !token) {
				throw new Error(start?.message ?? t("recovery_start_failed"));
			}

			if (deepLink) {
				await Linking.openURL(deepLink).catch(() => undefined);
			}

			let polls = 0;
			recoveryPollRef.current = setInterval(async () => {
				polls += 1;
				const verify = await verifyRecovery(token);

				if (verify?.status === "success" && verify.response?.userId) {
					stopRecoveryPolling();
					await setUserId(String(verify.response.userId));
					setUserIdState(String(verify.response.userId));
					setIsRecovering(false);
					Toast.show({ type: "success", text1: t("recovery_success") });
					await loadSubscription();
					return;
				}

				if (polls >= RECOVERY_MAX_POLLS) {
					stopRecoveryPolling();
					setIsRecovering(false);
					Toast.show({ type: "error", text1: t("recovery_timeout") });
				}
			}, RECOVERY_POLL_MS);
		} catch (error) {
			setIsRecovering(false);
			Toast.show({
				type: "error",
				text1:
					error instanceof Error ? error.message : t("recovery_start_failed"),
			});
		}
	};

	if (isLoading) {
		return <ActivityIndicator size="large" />;
	}

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>{t("account_title")}</Text>
			</View>
			<View style={styles.accountContainer}>
				<View style={styles.accountRow}>
					<Text style={styles.accountLabel}>{t("account_uuid")}</Text>
					<View style={styles.accountValueRow}>
						<Text
							style={styles.accountValue}
							numberOfLines={1}
							ellipsizeMode="middle">
							{userId || "—"}
						</Text>
						<TouchableOpacity
							activeOpacity={0.7}
							style={styles.copyButton}
							onPress={copyUserId}>
							<Text style={styles.copyButtonText}>{t("account_copy")}</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.accountRow}>
					<Text style={styles.accountLabel}>{t("account_subscription")}</Text>
					{isLoadingSubscription ? (
						<ActivityIndicator color={theme.colors.important2} />
					) : (
						<Text
							style={[styles.accountValue, { color: theme.colors.important3 }]}>
							{subscriptionText ?? t("account_free")}
						</Text>
					)}
				</View>

				<View style={styles.accountRow}>
					<Text style={styles.accountLabel}>{t("account_tgid")}</Text>
					<Text style={styles.accountValue}>
						{tgId.replaceAll("\d", "*") || "—"}
					</Text>
				</View>
			</View>

			<View style={styles.header}>
				<Text style={styles.headerTitle}>{t("settings_title")}</Text>
			</View>
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
								typeof callback === "function" ? callback(language) : callback;

							if (newValue) {
								setLanguage(newValue);
								updateSetting("localization", newValue);
								i18n.changeLanguage(newValue);
							}
						}}
						setItems={setLanguages}
						listMode="SCROLLVIEW"
						style={{
							backgroundColor: theme.colors.primary,
							borderColor: "transparent",
							minHeight: 40,
							width: 125,
						}}
						containerStyle={{
							width: 125,
							borderRadius: 12,
						}}
						dropDownContainerStyle={{
							backgroundColor: theme.colors.primary,
							borderColor: "#3D3D3D",
							borderRadius: 12,
						}}
						textStyle={{
							color: theme.colors.text,
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
				<Text style={styles.groupLabel}>{t("section_ui")}</Text>
				<View style={styles.settingItem}>
					<Text style={styles.settingLabel}>{t("theme")}</Text>
					<TouchableOpacity
						style={styles.settingThemeButton}
						onPress={() => {
							updateTheme("theme", themeName === "dark" ? "light" : "dark");
						}}>
						{themeName === "dark" ? <SunIcon /> : <MoonIcon />}
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.settingGroup}>
				<Text style={styles.groupLabel}>{t("telegram_id_title")}</Text>
				<View style={styles.telegramContainer}>
					<Text style={styles.telegramHint}>{t("telegram_id_hint")}</Text>
					<TextInput
						value={tgId}
						onChangeText={(value) => setTgId(value.replace(/[^0-9]/g, ""))}
						placeholder={t("telegram_id_placeholder")}
						placeholderTextColor={theme.colors.tretiary}
						keyboardType="number-pad"
						inputMode="numeric"
						maxLength={20}
						autoCorrect={false}
						cursorColor={theme.colors.text}
						style={styles.telegramInput}
					/>
					<TouchableOpacity
						activeOpacity={0.8}
						style={styles.telegramSaveButton}
						onPress={saveTelegramId}>
						<Text style={styles.telegramSaveText}>{t("save")}</Text>
					</TouchableOpacity>

					<Text style={styles.telegramHint}>{t("recovery_hint")}</Text>
					<TouchableOpacity
						activeOpacity={0.8}
						style={styles.restoreButton}
						disabled={isRecovering}
						onPress={handleRestore}>
						{isRecovering ? (
							<ActivityIndicator color={theme.colors.important2} />
						) : (
							<Text style={styles.restoreButtonText}>
								{t("recovery_button")}
							</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</ScrollView>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			rowGap: 12,
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			marginTop: 30,
			marginBottom: 30,
		},
		headerTitle: {
			color: theme.colors.text,
			fontSize: 32,
			fontFamily: "Nunito-Regular",
		},
		settingGroup: {
			marginBottom: 28,
		},
		groupLabel: {
			color: theme.colors.text,
			fontSize: 20,
			marginBottom: 12,
		},
		settingItem: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			backgroundColor: theme.colors.card,
			borderRadius: 12,
			paddingVertical: 14,
			paddingHorizontal: 14,
			marginBottom: 12,
			width: "100%",
		},
		settingLabel: {
			color: theme.colors.secondary,
			fontSize: 16,
			flex: 1,
		},
		settingThemeButton: {
			justifyContent: "center",
			alignItems: "center",
			borderRadius: 12,
			height: 48,
			width: 48,
			backgroundColor: theme.colors.text,
		},
		telegramContainer: {
			backgroundColor: theme.colors.card,
			borderRadius: 12,
			padding: 14,
			rowGap: 12,
			width: "100%",
		},
		telegramHint: {
			color: theme.colors.secondary,
			fontSize: 14,
			lineHeight: 20,
		},
		telegramInput: {
			backgroundColor: theme.colors.primary,
			borderRadius: 12,
			color: theme.colors.text,
			fontSize: 16,
			paddingHorizontal: 14,
			paddingVertical: 12,
			width: "100%",
		},
		telegramSaveButton: {
			alignItems: "center",
			backgroundColor: theme.colors.important2,
			borderRadius: 12,
			paddingVertical: 14,
		},
		telegramSaveText: {
			color: theme.colors.background,
			fontFamily: "Nunito-Bold",
			fontSize: 16,
		},
		restoreButton: {
			alignItems: "center",
			borderColor: theme.colors.important2,
			borderWidth: 1,
			borderRadius: 12,
			paddingVertical: 14,
		},
		restoreButtonText: {
			color: theme.colors.important2,
			fontFamily: "Nunito-Bold",
			fontSize: 16,
		},
		accountContainer: {
			rowGap: 12,
		},
		accountRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			backgroundColor: theme.colors.card,
			borderRadius: 12,
			paddingVertical: 14,
			paddingHorizontal: 14,
			marginBottom: 12,
			width: "100%",
		},
		accountLabel: {
			color: theme.colors.secondary,
			fontSize: 16,
			flexShrink: 0,
			marginRight: 12,
		},
		accountValueRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "flex-end",
			flex: 1,
			minWidth: 0,
			columnGap: 10,
		},
		accountValue: {
			color: theme.colors.text,
			fontSize: 15,
			flexShrink: 1,
			textAlign: "right",
		},
		copyButton: {
			backgroundColor: theme.colors.important2,
			borderRadius: 10,
			paddingHorizontal: 12,
			paddingVertical: 8,
		},
		copyButtonText: {
			color: theme.colors.background,
			fontSize: 13,
			fontWeight: "700",
		},
	});
