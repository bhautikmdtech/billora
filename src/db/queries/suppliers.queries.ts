import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq, and, sql, ilike, or } from "drizzle-orm";

export async function getSupplierById(id: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id))
    .limit(1);
  return supplier || null;
}

export async function getShopSuppliers(shopId: string, search?: string, limit = 20, offset = 0) {
  const whereClauses = [eq(suppliers.shopId, shopId), eq(suppliers.isActive, true)];
  if (search) {
    whereClauses.push(or(
      ilike(suppliers.name, `%${search}%`),
      ilike(suppliers.phone, `%${search}%`),
      ilike(suppliers.email, `%${search}%`)
    ) as any);
  }

  return db
    .select()
    .from(suppliers)
    .where(and(...whereClauses))
    .limit(limit)
    .offset(offset);
}
