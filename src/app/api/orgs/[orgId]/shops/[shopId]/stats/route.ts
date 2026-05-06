import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { getShopStats } from "@/db/queries/stats.queries";
import { db } from "@/db";
import { sales } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const stats = await getShopStats(params.shopId);

    // Recent Sales
    const recentSales = await db
      .select()
      .from(sales)
      .where(eq(sales.shopId, params.shopId))
      .orderBy(sql`${sales.createdAt} DESC`)
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        recentSales,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
