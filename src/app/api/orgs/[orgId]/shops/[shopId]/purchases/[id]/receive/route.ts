import { NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders, purchaseOrderItems, skus, suppliers, auditLogs, shops } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { generateSkuCode } from "@/lib/sku-code";
import { generateQrData, generateQrImage } from "@/lib/qr";

const receiveSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().uuid(),
    qtyReceived: z.number().int().nonnegative(),
  })),
});

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string, id: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const [order] = await db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, params.id), eq(purchaseOrders.shopId, params.shopId)));

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, order.id));

    return NextResponse.json({ success: true, data: { ...order, items } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgId: string, shopId: string, id: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const body = await req.json();
    const validated = receiveSchema.parse(body);

    const [order] = await db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, params.id), eq(purchaseOrders.shopId, params.shopId)));

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const [shop] = await db.select().from(shops).where(eq(shops.id, params.shopId));

    const result = await db.transaction(async (tx) => {
      let totalReceivedCost = 0;
      let allReceived = true;
      let someReceived = false;

      for (const receivedItem of validated.items) {
        const [item] = await tx
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.id, receivedItem.itemId));

        if (!item) continue;

        const newQtyReceived = item.qtyReceived + receivedItem.qtyReceived;
        await tx
          .update(purchaseOrderItems)
          .set({ qtyReceived: newQtyReceived })
          .where(eq(purchaseOrderItems.id, item.id));

        totalReceivedCost += receivedItem.qtyReceived * item.costPrice;
        
        if (newQtyReceived < item.qtyOrdered) allReceived = false;
        if (newQtyReceived > 0) someReceived = true;

        // Generate SKUs
        // Find current SKU count for this shop/category/color to keep sequence
        const [skuCount] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(skus)
          .where(and(eq(skus.shopId, params.shopId), eq(skus.category, item.category || "")));
        
        let counter = Number(skuCount.count) + 1;

        for (let i = 0; i < receivedItem.qtyReceived; i++) {
          const skuCode = generateSkuCode(shop.code, item.category || "GEN", item.color || "NA", counter++);
          const qrData = generateQrData(shop.code, skuCode, item.category || "GEN", item.color || "NA");
          const qrImageUrl = await generateQrImage(qrData);

          await tx.insert(skus).values({
            orgId: params.orgId,
            shopId: params.shopId,
            purchaseOrderId: order.id,
            purchaseOrderItemId: item.id,
            supplierId: order.supplierId,
            skuCode,
            qrData,
            qrImageUrl,
            category: item.category,
            subCategory: item.subCategory,
            color: item.color,
            size: item.size,
            description: item.description,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            mrp: item.mrp,
            gstPercent: item.gstPercent,
            status: "available",
          });
        }
      }

      const status = allReceived ? "received" : (someReceived ? "partial" : "pending");
      
      await tx
        .update(purchaseOrders)
        .set({ 
          status, 
          receivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, order.id));

      if (order.supplierId) {
        await tx
          .update(suppliers)
          .set({ 
            balance: sql`${suppliers.balance} + ${totalReceivedCost}`,
            updatedAt: new Date()
          })
          .where(eq(suppliers.id, order.supplierId));
      }

      await tx.insert(auditLogs).values({
        orgId: params.orgId,
        shopId: params.shopId,
        userId: user.id,
        action: "purchase.received",
        entity: "purchase_order",
        entityId: order.id,
      });

      return { status };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) { return handleError(err); }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
