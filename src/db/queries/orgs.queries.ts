import { db } from "@/db";
import { organizations, orgMembers, shops, shopMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getOrganizationById(id: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return org || null;
}

export async function getOrganizationBySlug(slug: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return org || null;
}

export async function getUserOrganizations(userId: string) {
  return db
    .select({
      organization: organizations,
      role: orgMembers.role,
      status: orgMembers.status,
    })
    .from(orgMembers)
    .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
    .where(eq(orgMembers.userId, userId));
}

export async function getOrganizationMembers(orgId: string) {
  return db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.orgId, orgId));
}
