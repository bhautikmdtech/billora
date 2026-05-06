import { db } from "@/db";
import { organizations, shops, orgMembers, shopMembers, subscriptions } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";
import { getProfileById, upsertProfile } from "@/db/queries/profiles.queries";
import { stripe } from "@/lib/stripe";
import { serverEnv } from "@/lib/env/server";
import { generateSlug } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  orgCategory: z.enum([
    "saree", "dress", "kariyana", "jewellery", "electronics", "hardware", "general",
  ]),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
});

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = schema.parse(body);

    // Ensure profile exists
    const existing = await getProfileById(user.id);
    if (!existing) {
      await upsertProfile({
        id: user.id,
        fullName:
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "User",
      });
    }

    // Check if user already has an org (prevent duplicate onboarding)
    const existingMembership = await db.query.orgMembers.findFirst({
      where: (t, { eq }) => eq(t.userId, user.id),
    });
    if (existingMembership) {
      return fail("You already belong to an organization", 409);
    }

    // Generate unique org slug
    let slug = generateSlug(validated.orgName);
    const slugExists = await db.query.organizations.findFirst({
      where: (t, { eq }) => eq(t.slug, slug),
    });
    if (slugExists) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    // Shop code = first 3 uppercase letters
    const shopCode = validated.shopName.slice(0, 3).toUpperCase();

    const result = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: validated.orgName,
          slug,
          category: validated.orgCategory,
          createdBy: user.id,
        })
        .returning();

      const [shop] = await tx
        .insert(shops)
        .values({
          orgId: org.id,
          name: validated.shopName,
          code: shopCode,
          createdBy: user.id,
        })
        .returning();

      await tx.insert(orgMembers).values({
        orgId: org.id,
        userId: user.id,
        role: "org_owner",
      });

      await tx.insert(shopMembers).values({
        orgId: org.id,
        shopId: shop.id,
        userId: user.id,
        role: "admin",
      });

      let stripeCustomerId: string | undefined;
      if (!serverEnv.STRIPE_SKIP && serverEnv.STRIPE_SECRET_KEY) {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: validated.orgName,
          metadata: { orgId: org.id },
        });
        stripeCustomerId = customer.id;
      }

      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      await tx.insert(subscriptions).values({
        orgId: org.id,
        stripeCustomerId,
        status: "trialing",
        planName: "Free Trial",
        trialEnd,
      });

      return { org, shop };
    });

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
