import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { useBackendClient } from "@/hooks/useBackendClient";
import {
	getReminderDays,
	syncSubscriptionExpiryReminder,
} from "@/hooks/useSubscriptionExpiryReminder";
import { UserPlan, VpnUser } from "@/types/VpnUser";
import { getStoredTelegramId } from "@/utility/telegramId";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Linking,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Toast from "react-native-toast-message";

const PAYMENT_URL = "https://traveler-vpn.com/pay";
const POLL_INTERVAL_MS = 5000;
const RENEWAL_KEY = "@renewal_invoice";

interface RenewalInvoice {
	code: string;
	payUrl: string;
	expiresAt: number;
}

const formatRemaining = (ms: number) => {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function SubscriptionScreen() {
	const { t } = useTranslation();
	const theme = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const client = useBackendClient();
	const clientRef = useRef(client);
	clientRef.current = client;

	const [user, setUser] = useState<VpnUser | null>(null);
	const [isLoadingUser, setIsLoadingUser] = useState(true);
	const [isCreatingCode, setIsCreatingCode] = useState(false);
	const [isChecking, setIsChecking] = useState(false);
	const [code, setCode] = useState<string | null>(null);
	const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
	const [renewal, setRenewal] = useState<RenewalInvoice | null>(null);
	const [now, setNow] = useState(Date.now());

	const requireTelegramId = async (): Promise<boolean> => {
		const telegramId = await getStoredTelegramId();

		if (!telegramId) {
			Toast.show({
				type: "info",
				text1: t("toast_telegram_required_text1"),
				text2: t("toast_telegram_required_text2"),
			});
			return false;
		}
		return true;
	};

	const codeRef = useRef<string | null>(null);
	useEffect(() => {
		codeRef.current = code;
	}, [code]);

	const isBusiness = user?.plan === UserPlan.BUSINESS;
	const expiryLabel = user?.expiryAt
		? new Date(Number(user.expiryAt)).toLocaleDateString()
		: null;

	const loadRenewal = useCallback(async (currentUser: VpnUser) => {
		const days = getReminderDays();
		const windowMs = days * 24 * 60 * 60 * 1000;
		const expiryAt = currentUser.expiryAt ? Number(currentUser.expiryAt) : 0;
		const withinWindow =
			currentUser.plan === UserPlan.BUSINESS &&
			expiryAt > 0 &&
			Date.now() >= expiryAt - windowMs;

		if (!withinWindow) {
			setRenewal(null);
			return;
		}

		let cached: RenewalInvoice | null = null;
		try {
			const raw = await AsyncStorage.getItem(RENEWAL_KEY);
			cached = raw ? (JSON.parse(raw) as RenewalInvoice) : null;
		} catch {
			cached = null;
		}

		if (cached && cached.expiresAt > Date.now()) {
			setRenewal(cached);
			return;
		}

		const response = await clientRef.current.getRenewalInvoice(cached?.code);
		const data = response?.response;
		if (response?.status === "success" && data?.code && data?.payUrl) {
			const next: RenewalInvoice = {
				code: data.code,
				payUrl: data.payUrl,
				expiresAt: Number(data.expiresAt),
			};
			await AsyncStorage.setItem(RENEWAL_KEY, JSON.stringify(next)).catch(
				() => undefined,
			);
			setRenewal(next);
		} else {
			setRenewal(null);
		}
	}, []);

	const refreshUser = useCallback(async () => {
		try {
			const response = await clientRef.current.getUser();
			const currentUser =
				response?.status === "success" &&
				response.response &&
				typeof response.response === "object"
					? (response.response as VpnUser)
					: null;
			setUser(currentUser);
			if (currentUser) {
				await loadRenewal(currentUser);
			}
		} catch (error) {
			console.warn("Unable to load user", error);
		} finally {
			setIsLoadingUser(false);
		}
	}, [loadRenewal]);

	useEffect(() => {
		refreshUser();
	}, [refreshUser]);

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	const handleGetCode = async () => {
		if (!(await requireTelegramId())) return;
		setIsCreatingCode(true);
		try {
			const response = await clientRef.current.createBillingCode();
			const result = response?.response;
			if (response?.status !== "success" || !result?.code) {
				throw new Error(response?.message ?? t("subscription_code_error"));
			}
			setCode(result.code);
			setCodeExpiresAt(result.expiresAt ? Number(result.expiresAt) : null);
		} catch (error) {
			Toast.show({
				type: "error",
				text1:
					error instanceof Error ? error.message : t("subscription_code_error"),
			});
		} finally {
			setIsCreatingCode(false);
		}
	};

	const handleCopy = async () => {
		if (!code) return;
		await Clipboard.setStringAsync(code);
		Toast.show({ type: "success", text1: t("subscription_code_copied") });
	};

	const openUrl = async (url: string) => {
		const supported = await Linking.canOpenURL(url).catch(() => false);
		if (!supported) {
			Toast.show({ type: "error", text1: t("subscription_open_error") });
			return;
		}
		await Linking.openURL(url).catch(() => {
			Toast.show({ type: "error", text1: t("subscription_open_error") });
		});
	};

	const handleOpenPayment = async () => {
		const currentCode = codeRef.current;
		if (!currentCode) return;
		await openUrl(`${PAYMENT_URL}?code=${encodeURIComponent(currentCode)}`);
	};

	const handleOpenRenewal = async () => {
		if (!renewal) return;
		if (!(await requireTelegramId())) return;
		await openUrl(renewal.payUrl);
	};

	const onActivated = useCallback(async () => {
		const response = await clientRef.current.getUser();
		const refreshed =
			response?.status === "success" &&
			response.response &&
			typeof response.response === "object"
				? (response.response as VpnUser)
				: undefined;
		setUser(refreshed ?? null);
		if (refreshed?.expiryAt) {
			await syncSubscriptionExpiryReminder(Number(refreshed.expiryAt));
		}
		setCode(null);
		codeRef.current = null;
		setRenewal(null);
		await AsyncStorage.removeItem(RENEWAL_KEY).catch(() => undefined);
		Toast.show({ type: "success", text1: t("subscription_activated") });
	}, [t]);

	const checkCode = useCallback(async (candidate: string) => {
		try {
			const response = await clientRef.current.getBillingStatus(candidate);
			return (
				response?.status === "success" &&
				response?.response?.status === "APPLIED"
			);
		} catch {
			return false;
		}
	}, []);

	useEffect(() => {
		if (!code && !renewal) return;
		const id = setInterval(async () => {
			setIsChecking(true);
			try {
				if (renewal && (await checkCode(renewal.code))) {
					await onActivated();
					return;
				}
				if (code && (await checkCode(code))) {
					await onActivated();
				}
			} finally {
				setIsChecking(false);
			}
		}, POLL_INTERVAL_MS);
		return () => clearInterval(id);
	}, [code, renewal, checkCode, onActivated]);

	const remainingMs = codeExpiresAt ? codeExpiresAt - now : 0;
	const codeExpired = !!code && remainingMs <= 0;
	const renewalRemainingMs = renewal ? renewal.expiresAt - now : 0;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>{t("subscription_title")}</Text>
				<Text style={styles.subtitle}>{t("subscription_subtitle")}</Text>
			</View>

			<View style={styles.statusCard}>
				<View style={styles.statusRow}>
					<Text style={styles.statusLabel}>
						{t("subscription_current_plan")}
					</Text>
					{isLoadingUser ? (
						<ActivityIndicator color={theme.colors.important2} />
					) : (
						<Text style={styles.statusValue}>
							{isBusiness ? t("account_business") : t("account_free")}
						</Text>
					)}
				</View>
				{isBusiness && expiryLabel && (
					<View style={styles.statusRow}>
						<Text style={styles.statusLabel}>
							{t("subscription_expires_on")}
						</Text>
						<Text style={styles.statusValue}>{expiryLabel}</Text>
					</View>
				)}
			</View>

			{code ? (
				<View style={styles.codeBlock}>
					<Text style={styles.codeLabel}>{t("subscription_code_label")}</Text>
					<TouchableOpacity
						style={styles.codeValueWrap}
						onPress={handleCopy}
						activeOpacity={0.7}>
						<Text selectable style={styles.codeValue}>
							{code}
						</Text>
					</TouchableOpacity>

					<View style={styles.codeMetaRow}>
						<Text style={styles.codeMeta}>
							{codeExpired
								? t("subscription_code_expired")
								: `${t("subscription_code_expires_in")} ${formatRemaining(remainingMs)}`}
						</Text>
						<TouchableOpacity onPress={handleCopy}>
							<Text style={styles.codeCopy}>{t("subscription_copy_code")}</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						disabled={codeExpired}
						style={[styles.primaryButton, codeExpired && styles.disabled]}
						onPress={handleOpenPayment}>
						<Text style={styles.primaryButtonText}>
							{t("subscription_open_payment")}
						</Text>
					</TouchableOpacity>

					<View style={styles.checkingRow}>
						{isChecking && (
							<ActivityIndicator size="small" color={theme.colors.important2} />
						)}
						<Text style={styles.checkingText}>
							{t("subscription_waiting_payment")}
						</Text>
					</View>

					{codeExpired && (
						<TouchableOpacity onPress={handleGetCode}>
							<Text style={styles.codeCopy}>
								{t("subscription_get_new_code")}
							</Text>
						</TouchableOpacity>
					)}
				</View>
			) : renewal ? (
				<View style={styles.codeBlock}>
					<Text style={styles.renewalLabel}>
						{t("subscription_renewal_ready")}
					</Text>
					<Text style={styles.actionHint}>
						{t("subscription_renewal_hint")}
					</Text>

					<TouchableOpacity
						style={styles.primaryButton}
						onPress={handleOpenRenewal}>
						<Text style={styles.primaryButtonText}>
							{t("subscription_renew_now")}
						</Text>
					</TouchableOpacity>

					<View style={styles.codeMetaRow}>
						<Text style={styles.codeMeta}>
							{renewalRemainingMs > 0
								? `${t("subscription_invoice_valid_for")} ${formatRemaining(renewalRemainingMs)}`
								: t("subscription_code_expired")}
						</Text>
						<TouchableOpacity onPress={() => refreshUser()}>
							<Text style={styles.codeCopy}>{t("subscription_refresh")}</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.checkingRow}>
						{isChecking && (
							<ActivityIndicator size="small" color={theme.colors.important2} />
						)}
						<Text style={styles.checkingText}>
							{t("subscription_waiting_payment")}
						</Text>
					</View>
				</View>
			) : (
				<View style={styles.actionBlock}>
					<Text style={styles.actionHint}>{t("subscription_web_hint")}</Text>
					<TouchableOpacity
						disabled={isCreatingCode}
						style={[styles.primaryButton, isCreatingCode && styles.disabled]}
						onPress={handleGetCode}>
						{isCreatingCode ? (
							<ActivityIndicator color={theme.colors.background} />
						) : (
							<Text style={styles.primaryButtonText}>
								{isBusiness
									? t("subscription_get_code_renew")
									: t("subscription_get_code")}
							</Text>
						)}
					</TouchableOpacity>
				</View>
			)}

			{renewal && code && (
				<TouchableOpacity onPress={handleOpenRenewal}>
					<Text style={styles.codeCopy}>{t("subscription_renew_now")}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			paddingTop: 28,
		},
		header: {
			marginBottom: 20,
		},
		eyebrow: {
			color: theme.colors.important2,
			fontSize: 13,
			fontWeight: "700",
			letterSpacing: 2,
			textTransform: "uppercase",
			marginBottom: 6,
		},
		title: {
			color: theme.colors.text,
			fontSize: 28,
			fontWeight: "700",
			marginBottom: 6,
		},
		subtitle: {
			color: theme.colors.secondary,
			fontSize: 14,
			lineHeight: 20,
		},
		statusCard: {
			backgroundColor: theme.colors.card,
			borderRadius: 16,
			padding: 16,
			rowGap: 12,
			marginBottom: 20,
		},
		statusRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		statusLabel: {
			color: theme.colors.secondary,
			fontSize: 14,
		},
		statusValue: {
			color: theme.colors.text,
			fontSize: 14,
			fontWeight: "700",
		},
		actionBlock: {
			rowGap: 14,
		},
		actionHint: {
			color: theme.colors.secondary,
			fontSize: 14,
			lineHeight: 20,
		},
		primaryButton: {
			backgroundColor: theme.colors.important2,
			borderRadius: 14,
			paddingVertical: 16,
			alignItems: "center",
			justifyContent: "center",
		},
		primaryButtonText: {
			color: theme.colors.background,
			fontSize: 16,
			fontWeight: "700",
		},
		disabled: {
			opacity: 0.5,
		},
		codeBlock: {
			rowGap: 12,
		},
		renewalLabel: {
			color: theme.colors.text,
			fontSize: 18,
			fontWeight: "700",
		},
		codeLabel: {
			color: theme.colors.secondary,
			fontSize: 14,
		},
		codeValueWrap: {
			backgroundColor: theme.colors.card,
			borderRadius: 16,
			paddingVertical: 20,
			alignItems: "center",
		},
		codeValue: {
			color: theme.colors.text,
			fontSize: 30,
			fontWeight: "700",
			letterSpacing: 6,
		},
		codeMetaRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		codeMeta: {
			color: theme.colors.secondary,
			fontSize: 13,
		},
		codeCopy: {
			color: theme.colors.important2,
			fontSize: 14,
			fontWeight: "700",
		},
		checkingRow: {
			flexDirection: "row",
			alignItems: "center",
			columnGap: 10,
		},
		checkingText: {
			color: theme.colors.secondary,
			fontSize: 13,
		},
	});
