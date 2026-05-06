import { NextResponse } from "next/server";
import { db } from "@/db";
import { skus } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string, qrData: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const decodedQrData = decodeURIComponent(params.qrData);

    const [sku] = await db
      .select()
      .from(skus)
      .where(and(eq(skus.qrData, decodedQrData), eq(skus.shopId, params.shopId)));

    if (!sku) {
      return NextResponse.json({ success: false, error: "SKU not found" }, { status: 404 });
    }

    if (sku.status !== "available") {
      return NextResponse.json({ 
        success: false, 
        error: `SKU is not available (Status: ${sku.status})`,
        code: 'SKU_NOT_AVAILABLE'
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: sku });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
