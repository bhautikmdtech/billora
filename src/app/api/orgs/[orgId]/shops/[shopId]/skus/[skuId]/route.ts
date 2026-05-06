import { NextResponse } from "next/server";
import { db } from "@/db";
import { skus, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, and } from "drizzle-orm";
import { handleError } from "@/lib/http";

export async function DELETE(
  _req: Request,
  { params }: { params: { orgId: string, shopId: string, skuId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const [deleted] = await db
      .delete(skus)
      .where(and(eq(skus.id, params.skuId), eq(skus.shopId, params.shopId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: "SKU not found" }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      orgId: params.orgId,
      shopId: params.shopId,
      userId: user.id,
      action: "sku.deleted",
      entity: "sku",
      entityId: params.skuId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
