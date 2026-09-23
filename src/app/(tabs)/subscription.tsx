import { CustomTheme } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";
import { useBackendClient } from "@/hooks/useBackendClient";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type PlanId = "business_monthly" | "business_quarterly" | "business_yearly";

interface SubscriptionPlan {
	id: PlanId;
	nameKey: string;
	periodKey: string;
	price: string;
	badgeKey?: string;
}

const plans: SubscriptionPlan[] = [
	{
		id: "business_monthly",
		nameKey: "plan_monthly",
		periodKey: "plan_per_month",
		price: "4.99$",
	},
	{
		id: "business_quarterly",
		nameKey: "plan_quarterly",
		periodKey: "plan_every_three_months",
		price: "12.99$",
		badgeKey: "plan_popular",
	},
	{
		id: "business_yearly",
		nameKey: "plan_yearly",
		periodKey: "plan_per_year",
		price: "39.99$",
		badgeKey: "plan_best_value",
	},
];

export default function SubscriptionScreen() {
	const [selectedPlanId, setSelectedPlanId] =
		useState<PlanId>("business_quarterly");
	const [paymentVisible, setPaymentVisible] = useState(false);
	const [isRenewing, setIsRenewing] = useState(false);

	const { renewSubscription } = useBackendClient();

	const { t } = useTranslation();
	const theme = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const insets = useSafeAreaInsets();

	const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)!;

	const openPaymentGateway = () => {
		// Replace this modal with the payment-provider redirect.
		setPaymentVisible(true);
	};

	const completeMockPayment = async () => {
		setIsRenewing(true);
		try {
			// A real gateway callback should supply its verified payment reference here.
			const paymentReference = `mock-${Date.now()}`;
			const result = await renewSubscription(selectedPlan.id, paymentReference);
			if (result?.status !== "success") {
				throw new Error(result?.message ?? "Unable to renew subscription");
			}
			setPaymentVisible(false);
			Toast.show({
				type: "success",
				text1: t("subscription_renewed"),
			});
		} catch (error) {
			console.error(error);
			Toast.show({
				type: "error",
				text1:
					error instanceof Error
						? error.message
						: t("subscription_renewal_failed"),
			});
		} finally {
			setIsRenewing(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.eyebrow}>{t("subscription_business")}</Text>
				<Text style={styles.title}>{t("subscription_title")}</Text>
				<Text style={styles.subtitle}>{t("subscription_subtitle")}</Text>
			</View>

			<ScrollView
				style={styles.planList}
				contentContainerStyle={styles.planListContent}
				showsVerticalScrollIndicator={false}>
				{plans.map((plan) => {
					const selected = plan.id === selectedPlanId;
					return (
						<TouchableOpacity
							key={plan.id}
							activeOpacity={0.8}
							style={[styles.planCard, selected && styles.selectedPlanCard]}
							onPress={() => setSelectedPlanId(plan.id)}>
							<View style={styles.planTopRow}>
								<View style={styles.planHeading}>
									<View
										style={[styles.radio, selected && styles.selectedRadio]}>
										{selected && <View style={styles.radioDot} />}
									</View>
									<Text style={styles.planName}>{t(plan.nameKey)}</Text>
								</View>
								{plan.badgeKey && (
									<Text style={styles.badge}>{t(plan.badgeKey)}</Text>
								)}
							</View>
							<View style={styles.priceRow}>
								<Text style={styles.price}>{plan.price}</Text>
								<Text style={styles.period}>{t(plan.periodKey)}</Text>
							</View>
							<Text style={styles.benefit}>{t("subscription_benefits")}</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			<TouchableOpacity
				style={styles.continueButton}
				onPress={openPaymentGateway}>
				<Text style={styles.continueButtonText}>
					{t("continue_to_payment")}
				</Text>
				<Text style={styles.continuePrice}>{selectedPlan.price}</Text>
			</TouchableOpacity>

			<Modal
				transparent
				animationType="slide"
				visible={paymentVisible}
				onRequestClose={() => !isRenewing && setPaymentVisible(false)}>
				<View style={[styles.modalBackdrop, { paddingBottom: insets.bottom }]}>
					<View style={styles.paymentSheet}>
						<View style={styles.paymentHandle} />
						<Text style={styles.paymentTitle}>
							{t("payment_placeholder_title")}
						</Text>
						<Text style={styles.paymentDescription}>
							{t("payment_placeholder_description")}
						</Text>
						<View style={styles.paymentSummary}>
							<Text style={styles.summaryPlan}>{t(selectedPlan.nameKey)}</Text>
							<Text style={styles.summaryPrice}>{selectedPlan.price}</Text>
						</View>
						<TouchableOpacity
							disabled={isRenewing}
							style={[styles.mockPayButton, isRenewing && styles.disabled]}
							onPress={completeMockPayment}>
							{isRenewing ? (
								<ActivityIndicator color={theme.colors.background} />
							) : (
								<Text style={styles.mockPayButtonText}>
									{t("simulate_payment_success")}
								</Text>
							)}
						</TouchableOpacity>
						<TouchableOpacity
							disabled={isRenewing}
							style={styles.cancelButton}
							onPress={() => setPaymentVisible(false)}>
							<Text style={styles.cancelButtonText}>{t("cancel")}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const createStyles = (theme: CustomTheme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			paddingTop: 28,
		},
		header: { marginBottom: 20 },
		eyebrow: {
			alignSelf: "flex-start",
			backgroundColor: theme.colors.important3,
			borderRadius: 20,
			color: theme.colors.background,
			fontSize: 12,
			fontWeight: "700",
			letterSpacing: 1.4,
			paddingHorizontal: 12,
			paddingVertical: 5,
			textTransform: "uppercase",
		},
		title: {
			color: theme.colors.text,
			fontFamily: "Nunito-Bold",
			fontSize: 34,
			lineHeight: 40,
			marginTop: 12,
		},
		subtitle: {
			color: theme.colors.tretiary,
			fontFamily: "Nunito-Regular",
			fontSize: 16,
			lineHeight: 22,
			marginTop: 6,
		},
		planList: { flex: 1 },
		planListContent: { paddingBottom: 14, rowGap: 12 },
		planCard: {
			backgroundColor: theme.colors.card,
			borderColor: "transparent",
			borderRadius: 12,
			borderWidth: 2,
			padding: 18,
		},
		selectedPlanCard: { borderColor: theme.colors.important2 },
		planTopRow: {
			alignItems: "center",
			flexDirection: "row",
			justifyContent: "space-between",
		},
		planHeading: { alignItems: "center", flexDirection: "row", columnGap: 10 },
		radio: {
			alignItems: "center",
			borderColor: theme.colors.tretiary,
			borderRadius: 10,
			borderWidth: 2,
			height: 20,
			justifyContent: "center",
			width: 20,
		},
		selectedRadio: { borderColor: theme.colors.important2 },
		radioDot: {
			backgroundColor: theme.colors.important2,
			borderRadius: 5,
			height: 10,
			width: 10,
		},
		planName: {
			color: theme.colors.secondary,
			fontFamily: "Nunito-Bold",
			fontSize: 18,
		},
		badge: {
			backgroundColor: theme.colors.important2,
			borderRadius: 10,
			color: theme.colors.background,
			fontSize: 11,
			fontWeight: "700",
			paddingHorizontal: 9,
			paddingVertical: 4,
		},
		priceRow: { alignItems: "baseline", flexDirection: "row", marginTop: 16 },
		price: {
			color: theme.colors.secondary,
			fontFamily: "Nunito-Bold",
			fontSize: 30,
		},
		period: { color: theme.colors.tretiary, fontSize: 13, marginLeft: 8 },
		benefit: {
			color: theme.colors.secondary,
			fontSize: 13,
			marginTop: 8,
			opacity: 0.8,
		},
		continueButton: {
			alignItems: "center",
			backgroundColor: theme.colors.important2,
			borderRadius: 12,
			flexDirection: "row",
			justifyContent: "space-between",
			paddingHorizontal: 20,
			paddingVertical: 15,
		},
		continueButtonText: {
			color: theme.colors.background,
			fontFamily: "Nunito-Bold",
			fontSize: 17,
		},
		continuePrice: {
			color: theme.colors.background,
			fontFamily: "Nunito-Bold",
			fontSize: 17,
		},
		modalBackdrop: {
			backgroundColor: "rgba(0,0,0,0.65)",
			flex: 1,
			justifyContent: "flex-end",
		},
		paymentSheet: {
			backgroundColor: theme.colors.primary,
			borderTopLeftRadius: 28,
			borderTopRightRadius: 28,
			padding: 24,
			paddingBottom: 36,
		},
		paymentHandle: {
			alignSelf: "center",
			backgroundColor: theme.colors.tretiary,
			borderRadius: 2,
			height: 4,
			marginBottom: 22,
			width: 44,
		},
		paymentTitle: {
			color: theme.colors.text,
			fontFamily: "Nunito-Bold",
			fontSize: 24,
		},
		paymentDescription: {
			color: theme.colors.tretiary,
			fontSize: 15,
			lineHeight: 21,
			marginTop: 8,
		},
		paymentSummary: {
			backgroundColor: theme.colors.card,
			borderRadius: 14,
			flexDirection: "row",
			justifyContent: "space-between",
			marginVertical: 20,
			padding: 16,
		},
		summaryPlan: { color: theme.colors.secondary, fontSize: 16 },
		summaryPrice: {
			color: theme.colors.secondary,
			fontFamily: "Nunito-Bold",
			fontSize: 17,
		},
		mockPayButton: {
			alignItems: "center",
			backgroundColor: theme.colors.important2,
			borderRadius: 14,
			justifyContent: "center",
			minHeight: 50,
		},
		mockPayButtonText: {
			color: theme.colors.background,
			fontFamily: "Nunito-Bold",
			fontSize: 16,
		},
		cancelButton: { alignItems: "center", paddingTop: 16 },
		cancelButtonText: { color: theme.colors.text, fontSize: 16 },
		disabled: { opacity: 0.6 },
	});
