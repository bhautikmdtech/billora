import { ok, handleError } from "@/lib/http";
import { getPlansFromStripe } from "@/lib/stripe";
import { serverEnv } from "@/lib/env/server";

const FALLBACK_PLANS = [
  {
    id: "free",
    priceId: "",
    name: "Free Trial",
    description: "14-day trial with all features",
    features: ["1 shop", "500 SKUs", "5 team members", "Basic reports"],
    amount: 0,
    interval: "month",
    currency: "inr",
  },
  {
    id: "basic",
    priceId: "price_basic",
    name: "Basic",
    description: "Perfect for growing businesses",
    features: ["3 shops", "Unlimited SKUs", "20 team members", "Advanced reports", "CSV exports"],
    amount: 99900,
    interval: "month",
    currency: "inr",
  },
  {
    id: "pro",
    priceId: "price_pro",
    name: "Pro",
    description: "For large multi-branch operations",
    features: ["Unlimited shops", "Unlimited SKUs", "Unlimited members", "All reports", "Priority support"],
    amount: 299900,
    interval: "month",
    currency: "inr",
  },
];

export async function GET() {
  try {
    if (serverEnv.STRIPE_SKIP || !serverEnv.STRIPE_SECRET_KEY) {
      return ok(FALLBACK_PLANS);
    }
    const plans = await getPlansFromStripe();
    return ok(plans.length ? plans : FALLBACK_PLANS);
  } catch (err) {
    console.error("[stripe/plans]", err);
    return ok(FALLBACK_PLANS);
  }
}
