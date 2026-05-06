import { stripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";
import { requireOrgRole } from "@/lib/permissions";
import { ok, fail, handleError } from "@/lib/http";
import { getOrgSubscription } from "@/lib/subscription";
import { serverEnv } from "@/lib/env/server";
import { z } from "zod";

const schema = z.object({
  orgId: z.string().uuid(),
  priceId: z.string(),
});

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = schema.parse(body);

    await requireOrgRole(["org_owner"], user.id, validated.orgId);

    if (serverEnv.STRIPE_SKIP) {
      return ok({ url: `${serverEnv.NEXT_PUBLIC_APP_URL}/workspace/settings/subscription?success=1` });
    }

    const subscription = await getOrgSubscription(validated.orgId);
    if (!subscription?.stripeCustomerId) {
      return fail("Stripe customer not found. Please contact support.", 400);
    }

    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: validated.priceId, quantity: 1 }],
      success_url: `${serverEnv.NEXT_PUBLIC_APP_URL}/workspace/settings/subscription?success=1`,
      cancel_url: `${serverEnv.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { orgId: validated.orgId },
    });

    return ok({ url: session.url });
  } catch (err) {
    return handleError(err);
  }
}
