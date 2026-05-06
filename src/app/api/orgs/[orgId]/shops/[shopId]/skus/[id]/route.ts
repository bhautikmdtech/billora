import { NextResponse } from "next/server";
import { db } from "@/db";
import { skus } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string, id: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const [sku] = await db
      .select()
      .from(skus)
      .where(and(eq(skus.id, params.id), eq(skus.shopId, params.shopId)));

    if (!sku) {
      return NextResponse.json({ success: false, error: "SKU not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sku });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
