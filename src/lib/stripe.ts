import Stripe from "stripe";

import { env } from "@/lib/env";
import type { StripePlan, StripePlanPrice } from "@/types/domain";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

type CachedPlans = {
  expiresAt: number;
  plans: StripePlan[];
};

let cachedPlans: CachedPlans | null = null;

function extractFeatures(metadata: Stripe.Metadata | null | undefined) {
  const rawFeatures = metadata?.features;
  if (!rawFeatures) {
    return [];
  }

  return rawFeatures
    .split("|")
    .map((feature: string) => feature.trim())
    .filter(Boolean);
}

function mapPrice(price: Stripe.Price): StripePlanPrice | null {
  if (!price.recurring?.interval || price.unit_amount == null) {
    return null;
  }

  return {
    priceId: price.id,
    amount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring.interval as StripePlanPrice["interval"],
  };
}

export async function getActiveStripePlans() {
  if (!stripe) {
    return [];
  }

  const now = Date.now();
  if (cachedPlans && cachedPlans.expiresAt > now) {
    return cachedPlans.plans;
  }

  const [products, prices] = await Promise.all([
    stripe.products.list({ active: true, limit: 100 }),
    stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] }),
  ]);

  const planMap = new Map<string, StripePlan>();

  products.data.forEach((product: Stripe.Product) => {
    planMap.set(product.id, {
      id: product.id,
      name: product.name,
      description: product.description,
      features: extractFeatures(product.metadata),
      prices: {},
    });
  });

  prices.data.forEach((price: Stripe.Price) => {
    const productId =
      typeof price.product === "string" ? price.product : price.product.id;
    const plan = planMap.get(productId);
    const mappedPrice = mapPrice(price);

    if (plan && mappedPrice) {
      plan.prices[mappedPrice.interval] = mappedPrice;
    }
  });

  const plans = Array.from(planMap.values());
  cachedPlans = {
    plans,
    expiresAt: now + 10 * 60 * 1000,
  };

  return plans;
}
