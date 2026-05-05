import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orgMembers, organizations, profiles, shopMembers, shops } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export class AuthError extends Error {
  status = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError();
  }

  return user;
}

export async function getOptionalUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function ensureProfile(userId: string, input?: { fullName?: string; phone?: string }) {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      id: userId,
      fullName: input?.fullName?.trim() || "New User",
      phone: input?.phone?.trim() || null,
    })
    .returning();

  return created;
}

export async function getCurrentUserContext(userId: string) {
  const [profile, memberships, assignedShops] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, userId)).limit(1),
    db
      .select({
        orgId: organizations.id,
        orgName: organizations.name,
        orgSlug: organizations.slug,
        role: orgMembers.role,
        status: orgMembers.status,
      })
      .from(orgMembers)
      .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
      .where(eq(orgMembers.userId, userId)),
    db
      .select({
        shopId: shops.id,
        shopName: shops.name,
        shopCode: shops.code,
        orgId: shops.orgId,
        role: shopMembers.role,
        status: shopMembers.status,
      })
      .from(shopMembers)
      .innerJoin(shops, eq(shops.id, shopMembers.shopId))
      .where(eq(shopMembers.userId, userId)),
  ]);

  return {
    profile: profile[0] ?? null,
    organizations: memberships,
    shops: assignedShops,
  };
}

export async function requireOrgMembership(userId: string, orgId: string) {
  const [membership] = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)))
    .limit(1);

  if (!membership || membership.status !== "active") {
    throw new AuthError("Organization access denied");
  }

  return membership;
}

export async function getRequestMeta() {
  const headerList = await headers();
  return {
    ip: headerList.get("x-forwarded-for") ?? null,
    userAgent: headerList.get("user-agent") ?? null,
  };
}
