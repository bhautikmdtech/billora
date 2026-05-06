import { db } from "@/db";
import { skus } from "@/db/schema";
import { eq, and, sql, or, ilike } from "drizzle-orm";

export async function getSkuById(id: string) {
  const [sku] = await db
    .select()
    .from(skus)
    .where(eq(skus.id, id))
    .limit(1);
  return sku || null;
}

export async function getSkuByQrData(qrData: string, shopId: string) {
  const [sku] = await db
    .select()
    .from(skus)
    .where(and(eq(skus.qrData, qrData), eq(skus.shopId, shopId)))
    .limit(1);
  return sku || null;
}

export async function searchSkus(shopId: string, query: string) {
  return db
    .select()
    .from(skus)
    .where(
      and(
        eq(skus.shopId, shopId),
        or(
          ilike(skus.skuCode, `%${query}%`),
          ilike(skus.description, `%${query}%`),
          ilike(skus.category, `%${query}%`)
        )
      )
    )
    .limit(20);
}
