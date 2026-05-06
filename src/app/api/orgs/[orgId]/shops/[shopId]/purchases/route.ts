import { NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders, purchaseOrderItems, auditLogs, shops } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const itemSchema = z.object({
  category: z.string(),
  subCategory: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  qtyOrdered: z.number().int().positive(),
  costPrice: z.number().int(),
  sellingPrice: z.number().int(),
  mrp: z.number().int(),
  gstPercent: z.string(),
});

const schema = z.object({
  supplierId: z.string().uuid(),
  items: z.array(itemSchema).min(1),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash", "upi", "card", "credit", "cheque"]).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const body = await req.json();
    const validated = schema.parse(body);

    const [shop] = await db.select().from(shops).where(eq(shops.id, params.shopId));
    
    // Generate order number
    const year = new Date().getFullYear();
    const [countRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.shopId, params.shopId), sql`${purchaseOrders.orderNumber} LIKE ${'PO-' + shop.code + '-' + year + '-%'}`));
    const sequence = Number(countRes.count) + 1;
    const orderNumber = `PO-${shop.code}-${year}-${String(sequence).padStart(4, "0")}`;

    const result = await db.transaction(async (tx) => {
      let subtotal = 0;
      let gstAmount = 0;
      
      const itemsToInsert = validated.items.map((item) => {
        const itemTotal = item.qtyOrdered * item.costPrice;
        subtotal += itemTotal;
        const itemGst = Math.round(itemTotal * (parseFloat(item.gstPercent) / 100));
        gstAmount += itemGst;
        
        return {
          category: item.category,
          subCategory: item.subCategory,
          color: item.color,
          size: item.size,
          description: item.description,
          qtyOrdered: item.qtyOrdered,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          mrp: item.mrp,
          gstPercent: item.gstPercent,
          totalCost: itemTotal,
        };
      });

      const totalAmount = subtotal + gstAmount;

      const [order] = await tx
        .insert(purchaseOrders)
        .values({
          orgId: params.orgId,
          shopId: params.shopId,
          supplierId: validated.supplierId,
          orderNumber,
          subtotal,
          gstAmount,
          totalAmount,
          invoiceNumber: validated.invoiceNumber,
          notes: validated.notes,
          paymentMethod: validated.paymentMethod,
          createdBy: user.id,
        })
        .returning();

      await tx.insert(purchaseOrderItems).values(
        itemsToInsert.map((item) => ({ ...item, purchaseOrderId: order.id }))
      );

      await tx.insert(auditLogs).values({
        orgId: params.orgId,
        shopId: params.shopId,
        userId: user.id,
        action: "purchase.created",
        entity: "purchase_order",
        entityId: order.id,
      });

      return order;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) { return handleError(err); }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    
    const whereClauses = [eq(purchaseOrders.shopId, params.shopId)];
    // Add more filters based on searchParams (status, supplierId, etc.)

    const data = await db
      .select()
      .from(purchaseOrders)
      .where(and(...whereClauses))
      .orderBy(sql`${purchaseOrders.createdAt} DESC`)
      .limit(limit)
      .offset(skip);

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(and(...whereClauses));

    return NextResponse.json({
      success: true,
      data,
      meta: buildMeta(Number(totalRes.count), page, limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
