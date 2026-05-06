import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, and, sql, or, ilike } from "drizzle-orm";

export async function getCustomerById(id: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return customer || null;
}

export async function lookupCustomerByPhone(shopId: string, phone: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.shopId, shopId), eq(customers.phone, phone)))
    .limit(1);
  return customer || null;
}

export async function upsertCustomer(data: typeof customers.$inferInsert) {
  // Manual upsert because we don't have a single unique constraint that fits all cases perfectly here, 
  // but we usually want to avoid duplicates by phone within a shop.
  if (data.phone) {
    const existing = await lookupCustomerByPhone(data.shopId, data.phone);
    if (existing) {
      const [updated] = await db
        .update(customers)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, existing.id))
        .returning();
      return updated;
    }
  }

  const [newCustomer] = await db.insert(customers).values(data).returning();
  return newCustomer;
}

export async function getShopCustomers(shopId: string, search?: string, limit = 20, offset = 0) {
  const whereClauses = [eq(customers.shopId, shopId)];
  if (search) {
    whereClauses.push(or(
      ilike(customers.name, `%${search}%`),
      ilike(customers.phone, `%${search}%`),
      ilike(customers.email, `%${search}%`)
    ) as any);
  }

  return db
    .select()
    .from(customers)
    .where(and(...whereClauses))
    .orderBy(sql`${customers.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}
