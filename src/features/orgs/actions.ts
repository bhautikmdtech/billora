"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  organizations,
  shops,
  orgMembers,
  shopMembers,
  subscriptions,
  invites,
  auditLogs,
  profiles,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { generateSlug, generateToken } from "@/lib/utils";
import { serverEnv } from "@/lib/env/server";
import { stripe } from "@/lib/stripe";
import { sendInviteEmail } from "@/lib/email";
import type { OnboardingInput, InviteMemberInput } from "./schemas";

export async function createOrgOnboarding(data: OnboardingInput) {
  const user = await requireAuth();

  // Ensure profile exists (may be missing if registration email was not verified yet)
  const existingProfile = await db.query.profiles.findFirst({
    where: (t, { eq }) => eq(t.id, user.id),
  });
  if (!existingProfile) {
    await db.insert(profiles).values({
      id: user.id,
      fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
      phone: user.user_metadata?.phone ?? null,
    });
  }

  // Prevent duplicate onboarding
  const existingMembership = await db.query.orgMembers.findFirst({
    where: (t, { eq }) => eq(t.userId, user.id),
  });
  if (existingMembership) {
    throw new Error("You already belong to an organization");
  }

  let slug = generateSlug(data.orgName);
  const slugExists = await db.query.organizations.findFirst({
    where: (t, { eq }) => eq(t.slug, slug),
  });
  if (slugExists) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const shopCode = data.shopName.slice(0, 3).toUpperCase();

  const result = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name: data.orgName,
        slug,
        category: data.orgCategory,
        createdBy: user.id,
      })
      .returning();

    const [shop] = await tx
      .insert(shops)
      .values({
        orgId: org.id,
        name: data.shopName,
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
        name: data.orgName,
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

  redirect(`/workspace/${result.org.slug}/${result.shop.id}/dashboard`);
}

export async function inviteMember(
  orgId: string,
  data: InviteMemberInput,
  inviterName: string
) {
  const user = await requireAuth();

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const org = await db.query.organizations.findFirst({
    where: (t, { eq }) => eq(t.id, orgId),
  });
  if (!org) throw new Error("Organization not found");

  const [invite] = await db
    .insert(invites)
    .values({
      orgId,
      shopId: data.shopId || null,
      invitedEmail: data.email,
      role: data.role,
      token,
      invitedBy: user.id,
      expiresAt,
    })
    .returning();

  await sendInviteEmail({
    to: data.email,
    inviterName,
    orgName: org.name,
    role: data.role,
    token,
  });

  await db.insert(auditLogs).values({
    orgId,
    userId: user.id,
    action: "member.invited",
    entity: "invite",
    entityId: invite.id,
  });

  return invite;
}
