export enum UserPlan {
	FREE = "FREE",
	BUSINESS = "BUSINESS",
}

export enum UserStatus {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
}

export const UserPlanDuration = {
	MONTHLY: { label: "monthly", months: 1 },
	QUARTERLY: { label: "quarterly", months: 3 },
	YEARLY: { label: "yearly", months: 12 },
} as const;

export type UserPlanDuration =
	(typeof UserPlanDuration)[keyof typeof UserPlanDuration];

export interface VpnUser {
	userId: string;
	username: string;
	email: string;
	tgId: bigint;
	connectionLinks: string[];
	plan: UserPlan;
	status: UserStatus;
	lastPaymentAt: bigint | null;
	expiryAt: bigint | null;
	trafficLeft: bigint | null;
}
