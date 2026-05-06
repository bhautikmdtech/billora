import { NextResponse } from "next/server";
import { db } from "@/db";
import { skus, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, and } from "drizzle-orm";
import { handleError } from "@/lib/http";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; shopId: string; skuId: string }> }
) {
  try {
    const { shopId, skuId } = await params;
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, shopId);

    const [sku] = await db
      .select()
      .from(skus)
      .where(and(eq(skus.id, skuId), eq(skus.shopId, shopId)));

    if (!sku) {
      return NextResponse.json({ success: false, error: "SKU not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sku });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; shopId: string; skuId: string }> }
) {
  try {
    const { orgId, shopId, skuId } = await params;
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, shopId);

    const [deleted] = await db
      .delete(skus)
      .where(and(eq(skus.id, skuId), eq(skus.shopId, shopId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: "SKU not found" }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      orgId,
      shopId,
      userId: user.id,
      action: "sku.deleted",
      entity: "sku",
      entityId: skuId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
