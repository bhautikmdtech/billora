import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env/server";

export const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2025-04-30.basil",
  typescript: true,
});

let cachedPlans: StripePlan[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

export interface StripePlan {
  id: string;
  priceId: string;
  name: string;
  description: string | null;
  features: string[];
  amount: number;
  interval: "month" | "year";
  currency: string;
}

export async function getPlansFromStripe(): Promise<StripePlan[]> {
  const now = Date.now();
  if (cachedPlans && now - lastFetchTime < CACHE_TTL) return cachedPlans;

  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  const plans: StripePlan[] = products.data
    .filter((p) => p.default_price)
    .map((product) => {
      const price = product.default_price as Stripe.Price;
      return {
        id: product.id,
        priceId: price.id,
        name: product.name,
        description: product.description,
        features: (product.metadata.features ?? "").split(",").map((f) => f.trim()).filter(Boolean),
        amount: price.unit_amount ?? 0,
        interval: (price.recurring?.interval ?? "month") as "month" | "year",
        currency: price.currency,
      };
    });

  cachedPlans = plans;
  lastFetchTime = now;
  return plans;
}
