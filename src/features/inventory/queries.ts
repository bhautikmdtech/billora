import { db } from "@/db";
import { skus } from "@/db/schema";
import { eq, and, ilike, or, sql, desc } from "drizzle-orm";

export interface SkuFilters {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getShopSkus(shopId: string, filters: SkuFilters = {}) {
  const { search, category, status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const where = [eq(skus.shopId, shopId)];

  if (search) {
    where.push(
      or(
        ilike(skus.skuCode, `%${search}%`),
        ilike(skus.description, `%${search}%`),
        ilike(skus.category, `%${search}%`),
        ilike(skus.color, `%${search}%`)
      ) as ReturnType<typeof eq>
    );
  }
  if (category) where.push(eq(skus.category, category));
  if (status) where.push(eq(skus.status, status as "available" | "sold" | "returned_supplier" | "damaged"));

  const [data, [countRow]] = await Promise.all([
    db.select().from(skus).where(and(...where)).orderBy(desc(skus.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(skus).where(and(...where)),
  ]);

  return {
    data,
    total: Number(countRow.count),
    pages: Math.ceil(Number(countRow.count) / limit),
    page,
  };
}

export async function getShopCategories(shopId: string) {
  const rows = await db
    .selectDistinct({ category: skus.category })
    .from(skus)
    .where(and(eq(skus.shopId, shopId), sql`${skus.category} IS NOT NULL`))
    .orderBy(skus.category);
  return rows.map((r) => r.category).filter(Boolean) as string[];
}

export async function countShopSkusByStatus(shopId: string) {
  const rows = await db
    .select({ status: skus.status, count: sql<number>`count(*)` })
    .from(skus)
    .where(eq(skus.shopId, shopId))
    .groupBy(skus.status);
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
}

export async function getNextSkuNumber(shopId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skus)
    .where(eq(skus.shopId, shopId));
  return Number(row.count) + 1;
}
