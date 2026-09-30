import { UserPlan, VpnUser } from "@/types/VpnUser";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import i18n from "../../i18n";
import { useBackendClient } from "./useBackendClient";

const REMINDER_IDENTIFIER = "travelervpn-subscription-expiry";
const CHANNEL_ID = "subscription";
const REMINDER_TYPE = "subscription-expiry";
const REMINDER_URL = "travelervpn://subscription";

// Show the reminder even when the app is in the foreground.
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

/**
 * Number of days before expiry at which the reminder fires. Configured through
 * `extra.subscriptionExpiryReminderDays` in app.config.ts.
 */
export const getReminderDays = (): number => {
	const raw = Constants.expoConfig?.extra?.subscriptionExpiryReminderDays;
	const value = typeof raw === "number" ? raw : Number(raw);
	return Number.isFinite(value) && value > 0 ? value : 0;
};

const ensurePermissions = async (): Promise<boolean> => {
	const current = await Notifications.getPermissionsAsync();
	if (current.granted) return true;
	if (!current.canAskAgain) return false;
	const requested = await Notifications.requestPermissionsAsync();
	return requested.granted;
};

const ensureChannel = async () => {
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: "Subscription",
			importance: Notifications.AndroidImportance.DEFAULT,
		});
	}
};

export const cancelSubscriptionExpiryReminder = async () => {
	await Notifications.cancelScheduledNotificationAsync(
		REMINDER_IDENTIFIER,
	).catch(() => undefined);
};

/**
 * Schedules (or clears) the local reminder that fires `subscriptionExpiryReminderDays`
 * before the subscription expiry timestamp.
 */
export const syncSubscriptionExpiryReminder = async (
	expiryAt: number | null | undefined,
) => {
	await cancelSubscriptionExpiryReminder();

	const days = getReminderDays();
	if (!days || !expiryAt) return;

	const triggerDate = new Date(Number(expiryAt) - days * 24 * 60 * 60 * 1000);
	if (triggerDate.getTime() <= Date.now()) return;

	if (!(await ensurePermissions())) return;
	await ensureChannel();

	await Notifications.scheduleNotificationAsync({
		identifier: REMINDER_IDENTIFIER,
		content: {
			title: i18n.t("subscription_expiring_title"),
			body: i18n.t("subscription_expiring_body", { days }),
			data: { type: REMINDER_TYPE, url: REMINDER_URL },
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DATE,
			date: triggerDate,
		},
	}).catch((error) => {
		console.warn("Unable to schedule subscription expiry reminder", error);
	});
};

/**
 * Keeps the reminder in sync with the backend on app start / foreground, and routes
 * the user to the subscription tab when the reminder notification is tapped.
 */
export const useSubscriptionExpiryReminder = () => {
	const router = useRouter();
	const client = useBackendClient();
	const clientRef = useRef(client);
	clientRef.current = client;

	const refresh = useCallback(async () => {
		try {
			const response = await clientRef.current.getUser();
			const user =
				response?.status === "success" &&
				response.response &&
				typeof response.response === "object"
					? (response.response as VpnUser)
					: undefined;

			if (user && user.plan === UserPlan.BUSINESS && user.expiryAt) {
				await syncSubscriptionExpiryReminder(Number(user.expiryAt));
			} else {
				await cancelSubscriptionExpiryReminder();
			}
		} catch (error) {
			console.warn("Unable to sync subscription expiry reminder", error);
		}
	}, []);

	useEffect(() => {
		refresh();

		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") {
				refresh();
			}
		});

		return () => subscription.remove();
	}, [refresh]);

	useEffect(() => {
		let subscription: Notifications.EventSubscription | null = null;
		try {
			const handleResponse = (
				response: Notifications.NotificationResponse | null,
			) => {
				const data = response?.notification.request.content.data as
					| { type?: string }
					| undefined;
				if (data?.type === REMINDER_TYPE) {
					router.push("/subscription");
				}
			};

			// Cold start: the app may have been launched by tapping the notification.
			const notification = Notifications.getLastNotificationResponse();

			if (!notification)
				throw new Error("Notification response cant be received");

			subscription =
				Notifications.addNotificationResponseReceivedListener(handleResponse);
		} catch (e) {
			console.error(e);
		} finally {
			return () => subscription?.remove();
		}
	}, [router]);

	return { refresh };
};
