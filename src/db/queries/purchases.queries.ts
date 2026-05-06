import { db } from "@/db";
import { purchaseOrders, purchaseOrderItems, suppliers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getPurchaseOrderById(id: string) {
  const [order] = await db
    .select({
      order: purchaseOrders,
      supplier: suppliers,
    })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .where(eq(purchaseOrders.id, id))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, id));

  return {
    ...order.order,
    supplier: order.supplier,
    items,
  };
}

export async function getShopPurchaseOrders(shopId: string, limit = 20, offset = 0) {
  return db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.shopId, shopId))
    .orderBy(sql`${purchaseOrders.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}
