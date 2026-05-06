import { db } from "@/db";
import { shops, shopMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getShopById(id: string) {
  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.id, id))
    .limit(1);
  return shop || null;
}

export async function getOrganizationShops(orgId: string) {
  return db
    .select()
    .from(shops)
    .where(eq(shops.orgId, orgId));
}

export async function getUserShops(userId: string, orgId: string) {
  return db
    .select({
      shop: shops,
      role: shopMembers.role,
    })
    .from(shopMembers)
    .innerJoin(shops, eq(shopMembers.shopId, shops.id))
    .where(and(eq(shopMembers.userId, userId), eq(shopMembers.orgId, orgId)));
}
