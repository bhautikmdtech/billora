import { db } from "@/db";
import { orgMembers, shopMembers, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { forbidden } from "./errors";
import type { OrgRole, ShopRole } from "@/types/domain";

// ─── Permission Matrix ────────────────────────────────────────────────────────

type Permission =
  | "manage_org"         // rename, settings
  | "manage_shops"       // create, edit shops
  | "manage_members"     // add/remove org members
  | "invite_members"     // send invites
  | "manage_inventory"   // create/edit SKUs
  | "manage_pos"         // create sales
  | "manage_sales"       // view/edit all sales
  | "manage_purchases"   // purchase orders
  | "manage_suppliers"   // suppliers
  | "manage_expenses"    // expenses
  | "manage_returns"     // sales/purchase returns
  | "manage_employees"   // attendance, payroll
  | "view_reports"       // dashboard, analytics
  | "manage_billing"     // subscription
  | "superadmin";        // platform-wide

const ORG_PERMISSIONS: Record<OrgRole, Permission[]> = {
  org_owner: [
    "manage_org", "manage_shops", "manage_members", "invite_members",
    "manage_inventory", "manage_pos", "manage_sales", "manage_purchases",
    "manage_suppliers", "manage_expenses", "manage_returns", "manage_employees",
    "view_reports", "manage_billing",
  ],
  partner: [
    "manage_org", "manage_shops", "manage_members", "invite_members",
    "manage_inventory", "manage_pos", "manage_sales", "manage_purchases",
    "manage_suppliers", "manage_expenses", "manage_returns", "manage_employees",
    "view_reports",
  ],
  admin: [
    "manage_shops", "invite_members",
    "manage_inventory", "manage_pos", "manage_sales", "manage_purchases",
    "manage_suppliers", "manage_expenses", "manage_returns", "manage_employees",
    "view_reports",
  ],
  employee: ["manage_pos", "manage_sales"],
};

const SHOP_PERMISSIONS: Record<ShopRole, Permission[]> = {
  admin: [
    "manage_inventory", "manage_pos", "manage_sales", "manage_purchases",
    "manage_suppliers", "manage_expenses", "manage_returns", "manage_employees",
    "view_reports", "invite_members",
  ],
  employee: ["manage_pos", "manage_sales"],
};

// ─── Role Queries ─────────────────────────────────────────────────────────────

export async function getUserOrgRole(userId: string, orgId: string) {
  const [member] = await db
    .select({ role: orgMembers.role, status: orgMembers.status })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));

  if (!member || member.status !== "active") return null;
  return member.role;
}

export async function getUserShopRole(userId: string, shopId: string) {
  const [member] = await db
    .select({ role: shopMembers.role, status: shopMembers.status })
    .from(shopMembers)
    .where(and(eq(shopMembers.shopId, shopId), eq(shopMembers.userId, userId)));

  if (!member || member.status !== "active") return null;
  return member.role;
}

export async function isSuperAdmin(userId: string) {
  try {
    const [profile] = await db
      .select({ isSuperAdmin: profiles.isSuperAdmin })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    return profile?.isSuperAdmin ?? false;
  } catch {
    // Column may not exist yet — fall back to env var until migration runs
    const adminEmail = process.env.SUPERADMIN_EMAIL;
    if (!adminEmail) return false;
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    return false; // Can't check email from userId without join; safe default
  }
}

// ─── Permission Checks ────────────────────────────────────────────────────────

export function orgHasPermission(role: OrgRole, permission: Permission): boolean {
  return ORG_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function shopHasPermission(role: ShopRole, permission: Permission): boolean {
  return SHOP_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function checkOrgPermission(
  userId: string,
  orgId: string,
  permission: Permission
): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserOrgRole(userId, orgId);
  if (!role) return false;
  return orgHasPermission(role, permission);
}

export async function checkShopPermission(
  userId: string,
  shopId: string,
  orgId: string,
  permission: Permission
): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;

  // org_owner and partner have full access to all shops in their org
  const orgRole = await getUserOrgRole(userId, orgId);
  if (orgRole === "org_owner" || orgRole === "partner") return true;
  if (orgRole === "admin") return true;

  const shopRole = await getUserShopRole(userId, shopId);
  if (!shopRole) return false;
  return shopHasPermission(shopRole, permission);
}

// ─── Guards (throw on failure) ────────────────────────────────────────────────

export async function requireOrgRole(roles: OrgRole[], userId: string, orgId: string) {
  const role = await getUserOrgRole(userId, orgId);
  if (!role || !roles.includes(role)) throw forbidden();
  return role;
}

export async function requireShopAccess(userId: string, shopId: string, orgId: string) {
  const hasAccess = await checkShopPermission(userId, shopId, orgId, "manage_pos");
  if (!hasAccess) throw forbidden();
}

export async function requireOrgPermission(
  userId: string,
  orgId: string,
  permission: Permission
) {
  const ok = await checkOrgPermission(userId, orgId, permission);
  if (!ok) throw forbidden();
}

export async function requireShopPermission(
  userId: string,
  shopId: string,
  orgId: string,
  permission: Permission
) {
  const ok = await checkShopPermission(userId, shopId, orgId, permission);
  if (!ok) throw forbidden();
}

// ─── Legacy helpers (keep for backward compat) ───────────────────────────────

export async function requireShopRole(
  roles: (OrgRole | ShopRole)[],
  userId: string,
  shopId: string
) {
  const [shopMember] = await db
    .select({ orgId: shopMembers.orgId })
    .from(shopMembers)
    .where(eq(shopMembers.shopId, shopId))
    .limit(1);

  if (shopMember) {
    const orgRole = await getUserOrgRole(userId, shopMember.orgId);
    if (orgRole === "org_owner" || orgRole === "partner") return orgRole;
    if (orgRole && roles.includes(orgRole)) return orgRole;
  }

  const role = await getUserShopRole(userId, shopId);
  if (!role || !roles.includes(role)) throw forbidden();
  return role;
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
