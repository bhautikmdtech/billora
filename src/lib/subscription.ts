import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const PLAN_LIMITS = {
  free: { shops: 1, skus: 500, members: 5, exports: false },
  trialing: { shops: 3, skus: -1, members: 20, exports: true },
  basic: { shops: 3, skus: -1, members: 20, exports: true },
  pro: { shops: -1, skus: -1, members: -1, exports: true },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export async function getOrgSubscription(orgId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId));
  return sub ?? null;
}

export async function getOrgPlan(orgId: string): Promise<Plan> {
  const sub = await getOrgSubscription(orgId);
  if (!sub) return "free";

  // Trialing counts as "trialing" plan
  if (sub.status === "trialing") return "trialing";
  if (sub.status !== "active") return "free";

  const planKey = (sub.planName?.toLowerCase() ?? "free") as Plan;
  return PLAN_LIMITS[planKey] ? planKey : "free";
}

export async function isFeatureAllowed(orgId: string, feature: "exports") {
  const plan = await getOrgPlan(orgId);
  return PLAN_LIMITS[plan][feature];
}

export async function checkShopLimit(orgId: string, currentCount: number): Promise<boolean> {
  const plan = await getOrgPlan(orgId);
  const limit = PLAN_LIMITS[plan].shops;
  return limit === -1 || currentCount < limit;
}
