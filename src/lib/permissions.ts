import { db } from "@/db";
import { orgMembers, shopMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { forbidden } from "./errors";
import type { OrgRole, ShopRole } from "@/types/domain";

export async function getUserOrgRole(userId: string, orgId: string) {
  const [member] = await db
    .select({ role: orgMembers.role })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
  return member?.role ?? null;
}

export async function getUserShopRole(userId: string, shopId: string) {
  const [member] = await db
    .select({ role: shopMembers.role })
    .from(shopMembers)
    .where(and(eq(shopMembers.shopId, shopId), eq(shopMembers.userId, userId)));
  return member?.role ?? null;
}

export async function requireOrgRole(roles: OrgRole[], userId: string, orgId: string) {
  const role = await getUserOrgRole(userId, orgId);
  if (!role || !roles.includes(role)) {
    throw forbidden("You don't have the required organization role");
  }
  return role;
}

export async function requireShopRole(
  roles: (OrgRole | ShopRole)[],
  userId: string,
  shopId: string
) {
  // org_owner / partner have access to all shops in their org
  const [shopMember] = await db
    .select({ orgId: shopMembers.orgId })
    .from(shopMembers)
    .where(eq(shopMembers.shopId, shopId))
    .limit(1);

  if (shopMember) {
    const orgRole = await getUserOrgRole(userId, shopMember.orgId);
    if (orgRole === "org_owner" || orgRole === "partner") return orgRole;
  }

  const role = await getUserShopRole(userId, shopId);
  if (!role || !roles.includes(role)) {
    throw forbidden("You don't have the required shop role");
  }
  return role;
}

export function isSuperadmin(email: string | undefined) {
  const adminEmail = process.env.SUPERADMIN_EMAIL;
  return !!adminEmail && email === adminEmail;
}

export function canManageOrg(role: OrgRole) {
  return role === "org_owner" || role === "partner";
}

export function canManageShop(role: OrgRole | ShopRole) {
  return role === "org_owner" || role === "partner" || role === "admin";
}

export function isOrgWide(role: OrgRole) {
  return role === "org_owner" || role === "partner";
}
