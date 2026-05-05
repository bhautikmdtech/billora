import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PlanName } from "@/types/domain";

const PLAN_LIMITS = {
  Free: {
    shops: 1,
    skus: 500,
    export: false,
    prioritySupport: false,
  },
  Basic: {
    shops: 3,
    skus: Number.POSITIVE_INFINITY,
    export: true,
    prioritySupport: false,
  },
  Pro: {
    shops: Number.POSITIVE_INFINITY,
    skus: Number.POSITIVE_INFINITY,
    export: true,
    prioritySupport: true,
  },
} as const;

export async function getOrgPlan(orgId: string): Promise<PlanName> {
  const [subscription] = await db
    .select({ planName: subscriptions.planName })
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .limit(1);

  const planName = subscription?.planName;
  if (planName === "Basic" || planName === "Pro") {
    return planName;
  }

  return "Free";
}

export async function getOrgPlanLimits(orgId: string) {
  const plan = await getOrgPlan(orgId);
  return {
    plan,
    limits: PLAN_LIMITS[plan],
  };
}

export async function assertOrgFeatureAccess(
  orgId: string,
  feature: keyof (typeof PLAN_LIMITS)["Free"]
) {
  const { plan, limits } = await getOrgPlanLimits(orgId);

  if (!limits[feature]) {
    throw new Error(`${feature} is not available on the ${plan} plan`);
  }

  return { plan, limits };
}
