import { db } from "@/db";
import { orgMembers, shopMembers, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getOrgMember(orgId: string, userId: string) {
  const [member] = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)))
    .limit(1);
  return member || null;
}

export async function getShopMember(shopId: string, userId: string) {
  const [member] = await db
    .select()
    .from(shopMembers)
    .where(and(eq(shopMembers.shopId, shopId), eq(shopMembers.userId, userId)))
    .limit(1);
  return member || null;
}

export async function addOrgMember(data: typeof orgMembers.$inferInsert) {
  const [member] = await db.insert(orgMembers).values(data).returning();
  return member;
}

export async function addShopMember(data: typeof shopMembers.$inferInsert) {
  const [member] = await db.insert(shopMembers).values(data).returning();
  return member;
}
