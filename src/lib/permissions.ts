import type { OrgRole, ShopRole } from "@/types/domain";

export class AuthorizationError extends Error {
  status = 403;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function canManageOrg(role: OrgRole | null | undefined) {
  return role === "org_owner" || role === "partner";
}

export function canManageShop(role: OrgRole | ShopRole | null | undefined) {
  return role === "org_owner" || role === "partner" || role === "admin";
}

export function canSell(role: OrgRole | ShopRole | null | undefined) {
  return (
    role === "org_owner" ||
    role === "partner" ||
    role === "admin" ||
    role === "employee"
  );
}

export function isPartnerOrOwner(role: OrgRole | null | undefined) {
  return role === "org_owner" || role === "partner";
}

export function isSuperadmin(email: string | null | undefined) {
  const target = process.env.SUPERADMIN_EMAIL;
  if (!target || !email) {
    return false;
  }

  return target.toLowerCase() === email.toLowerCase();
}

export async function requireOrgRole(
  allowedRoles: OrgRole[],
  currentRole: OrgRole | null | undefined
) {
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    throw new AuthorizationError("You do not have access to this organization");
  }

  return currentRole;
}

export async function requireShopRole(
  allowedRoles: Array<OrgRole | ShopRole>,
  currentRole: OrgRole | ShopRole | null | undefined
) {
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    throw new AuthorizationError("You do not have access to this shop");
  }

  return currentRole;
}
