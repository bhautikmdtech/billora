import { NextResponse } from "next/server";
import { db } from "@/db";
import { skus, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { parsePaginationParams, buildMeta } from "@/lib/pagination";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError } from "@/lib/http";

const schema = z.object({
  skuCode: z.string().min(2),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().int().nonnegative(),
  sellingPrice: z.number().int().nonnegative(),
  mrp: z.number().int().nonnegative(),
  gstPercent: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip, sort, order } = parsePaginationParams(searchParams);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const whereClauses = [eq(skus.shopId, params.shopId)];
    
    if (search) {
      whereClauses.push(or(
        ilike(skus.skuCode, `%${search}%`),
        ilike(skus.description, `%${search}%`),
        ilike(skus.category, `%${search}%`),
        ilike(skus.color, `%${search}%`)
      ) as any);
    }
    
    if (status) {
      whereClauses.push(eq(skus.status, status as any));
    }
    
    if (category) {
      whereClauses.push(eq(skus.category, category));
    }

    const data = await db
      .select()
      .from(skus)
      .where(and(...whereClauses))
      .orderBy(order === "asc" ? skus.createdAt : sql`${skus.createdAt} DESC`)
      .limit(limit)
      .offset(skip);

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(skus)
      .where(and(...whereClauses));

    return NextResponse.json({
      success: true,
      data,
      meta: buildMeta(Number(totalRes.count), page, limit),
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const body = await req.json();
    const validated = schema.parse(body);

    const [sku] = await db
      .insert(skus)
      .values({
        ...validated,
        orgId: params.orgId,
        shopId: params.shopId,
        qrData: validated.skuCode, // Default qrData to SKU code
        status: "available",
      })
      .returning();

    await db.insert(auditLogs).values({
      orgId: params.orgId,
      shopId: params.shopId,
      userId: user.id,
      action: "sku.created",
      entity: "sku",
      entityId: sku.id,
      changes: validated as any,
    });

    return NextResponse.json({ success: true, data: sku });
  } catch (err) {
    return handleError(err);
  }
}
