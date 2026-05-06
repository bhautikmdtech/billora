import { requireAuth } from "@/lib/auth";
import { requireOrgRole } from "@/lib/permissions";
import { ok, handleError } from "@/lib/http";
import { getOrgSubscription, PLAN_LIMITS, getOrgPlan } from "@/lib/subscription";

export async function GET(
  _req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner"], user.id, params.orgId);

    const subscription = await getOrgSubscription(params.orgId);
    const plan = await getOrgPlan(params.orgId);
    const limits = PLAN_LIMITS[plan];

    return ok({ subscription, plan, limits });
  } catch (err) {
    return handleError(err);
  }
}
