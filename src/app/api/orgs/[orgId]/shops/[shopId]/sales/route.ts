import { db } from "@/db";
import {
  sales,
  saleItems,
  skus,
  customers,
  dailyKharsa,
  notifications,
  auditLogs,
  shops,
} from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { ok, handleError } from "@/lib/http";
import { generateBillNumber } from "@/lib/bill-number";
import { eq, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { getShopSales } from "@/db/queries/sales.queries";
import { parsePaginationParams, buildMeta } from "@/lib/pagination";

const itemSchema = z.object({
  skuId: z.string().uuid().optional(),
  skuCode: z.string().optional(),
  sellingPrice: z.number().int().nonnegative(),
  discountAmount: z.number().int().nonnegative().default(0),
  gstPercent: z.string().or(z.number()).default("0"),
  quantity: z.number().int().positive().default(1),
});

const saleSchema = z.object({
  items: z.array(itemSchema).min(1, "At least one item required"),
  customerId: z.string().uuid().optional(),
  customerData: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.enum(["cash", "upi", "card", "credit", "cheque"]),
  amountPaid: z.number().int().nonnegative(),
  saveCustomer: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { orgId: string; shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(
      ["org_owner", "partner", "admin", "employee"],
      user.id,
      params.shopId
    );

    const body = await req.json();
    const validated = saleSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      let customerId = validated.customerId;

      // Create or find customer
      if (!customerId && validated.saveCustomer && validated.customerData?.phone) {
        const existing = await tx.query.customers.findFirst({
          where: (t, { and, eq }) =>
            and(
              eq(t.shopId, params.shopId),
              eq(t.phone, validated.customerData!.phone!)
            ),
        });
        if (existing) {
          customerId = existing.id;
        } else {
          const [newCustomer] = await tx
            .insert(customers)
            .values({
              orgId: params.orgId,
              shopId: params.shopId,
              name: validated.customerData.name ?? "Walk-in Customer",
              phone: validated.customerData.phone,
            })
            .returning();
          customerId = newCustomer.id;
        }
      }

      // Calculate totals
      const subtotal = validated.items.reduce(
        (sum, item) => sum + item.sellingPrice * item.quantity,
        0
      );
      const discountTotal = validated.items.reduce(
        (sum, item) => sum + item.discountAmount * item.quantity,
        0
      );
      const gstTotal = validated.items.reduce((sum, item) => {
        const pct = parseFloat(String(item.gstPercent)) / 100;
        const taxable = (item.sellingPrice - item.discountAmount) * item.quantity;
        return sum + Math.round(taxable * pct);
      }, 0);
      const grandTotal = subtotal - discountTotal + gstTotal;
      const changeReturned = Math.max(0, validated.amountPaid - grandTotal);

      const shopRow = await tx.query.shops.findFirst({
        where: (t, { eq }) => eq(t.id, params.shopId),
      });
      const billNumber = await generateBillNumber(params.shopId, shopRow?.code ?? "SHP");

      const [sale] = await tx
        .insert(sales)
        .values({
          orgId: params.orgId,
          shopId: params.shopId,
          billNumber,
          customerId,
          subtotal,
          discountTotal,
          gstTotal,
          grandTotal,
          paymentMethod: validated.paymentMethod,
          amountPaid: validated.amountPaid,
          changeReturned,
          createdBy: user.id,
        })
        .returning();

      // Insert sale items and mark SKUs as sold
      const skuIds = validated.items.filter((i) => i.skuId).map((i) => i.skuId!);

      for (const item of validated.items) {
        let skuCode = item.skuCode;
        let category: string | undefined;
        let subCategory: string | undefined;
        let color: string | undefined;
        let size: string | undefined;
        let mrp = 0;
        let gstAmt = 0;

        if (item.skuId) {
          const [sku] = await tx
            .select()
            .from(skus)
            .where(eq(skus.id, item.skuId));
          if (sku) {
            skuCode = sku.skuCode;
            category = sku.category ?? undefined;
            subCategory = sku.subCategory ?? undefined;
            color = sku.color ?? undefined;
            size = sku.size ?? undefined;
            mrp = sku.mrp;
          }
        }

        const pct = parseFloat(String(item.gstPercent)) / 100;
        gstAmt = Math.round((item.sellingPrice - item.discountAmount) * item.quantity * pct);

        await tx.insert(saleItems).values({
          saleId: sale.id,
          skuId: item.skuId,
          skuCode,
          category,
          subCategory,
          color,
          size,
          mrp,
          sellingPrice: item.sellingPrice,
          discountAmount: item.discountAmount,
          gstPercent: String(item.gstPercent),
          gstAmount: gstAmt,
          quantity: item.quantity,
        });
      }

      // Mark SKUs as sold
      if (skuIds.length) {
        await tx
          .update(skus)
          .set({ status: "sold", soldAt: new Date(), soldSaleId: sale.id })
          .where(inArray(skus.id, skuIds));
      }

      // Update customer stats
      if (customerId) {
        await tx
          .update(customers)
          .set({
            totalPurchases: sql`${customers.totalPurchases} + 1`,
            totalSpend: sql`${customers.totalSpend} + ${grandTotal}`,
            lastVisitAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, customerId));
      }

      // Update or create daily kharsa
      const today = new Date().toISOString().split("T")[0];
      const existingKharsa = await tx.query.dailyKharsa.findFirst({
        where: (t, { and, eq }) =>
          and(eq(t.shopId, params.shopId), eq(t.date, today)),
      });

      if (existingKharsa) {
        await tx
          .update(dailyKharsa)
          .set({
            totalSales: sql`${dailyKharsa.totalSales} + ${grandTotal}`,
            salesCount: sql`${dailyKharsa.salesCount} + 1`,
          })
          .where(eq(dailyKharsa.id, existingKharsa.id));
      } else {
        await tx.insert(dailyKharsa).values({
          orgId: params.orgId,
          shopId: params.shopId,
          date: today,
          totalSales: grandTotal,
          salesCount: 1,
        });
      }

      await tx.insert(auditLogs).values({
        orgId: params.orgId,
        shopId: params.shopId,
        userId: user.id,
        action: "sale.created",
        entity: "sale",
        entityId: sale.id,
      });

      return sale;
    });

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(
  req: Request,
  { params }: { params: { orgId: string; shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(
      ["org_owner", "partner", "admin", "employee"],
      user.id,
      params.shopId
    );

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);

    const data = await getShopSales(params.shopId, limit, skip);
    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sales)
      .where(eq(sales.shopId, params.shopId));

    return ok(data, buildMeta(Number(totalRes.count), page, limit));
  } catch (err) {
    return handleError(err);
  }
}
