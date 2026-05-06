import { db } from "@/db";
import { sales, saleItems, customers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getSaleById(id: string) {
  const [sale] = await db
    .select({
      sale: sales,
      customer: customers,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .where(eq(sales.id, id))
    .limit(1);
    
  if (!sale) return null;

  const items = await db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, id));

  return {
    ...sale.sale,
    customer: sale.customer,
    items,
  };
}

export async function getShopSales(shopId: string, limit = 10, offset = 0) {
  return db
    .select()
    .from(sales)
    .where(eq(sales.shopId, shopId))
    .orderBy(sql`${sales.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}
