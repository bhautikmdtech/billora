import { NextResponse } from "next/server";
import { db } from "@/db";
import { skus } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { parsePaginationParams, buildMeta } from "@/lib/pagination";
import { eq, and, ilike, or, sql } from "drizzle-orm";

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
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
