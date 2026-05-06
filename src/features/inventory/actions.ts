"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { skus, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { requireShopPermission } from "@/lib/permissions";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById } from "@/db/queries/shops.queries";
import { getNextSkuNumber } from "./queries";
import { parsePaise } from "@/lib/utils";
import type { AddSkuInput, EditSkuInput } from "./schemas";

function buildSkuCode(shopCode: string, category: string, color: string, n: number) {
  const cat = category.slice(0, 3).toUpperCase().replace(/\s/g, "");
  const col = color ? color.slice(0, 3).toUpperCase().replace(/\s/g, "") : "GEN";
  return `${shopCode}-${cat}-${col}-${String(n).padStart(4, "0")}`;
}

export async function addSkus(
  orgSlug: string,
  shopId: string,
  data: AddSkuInput
) {
  const user = await requireAuth();
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) throw new Error("Organization not found");

  await requireShopPermission(user.id, shopId, org.id, "manage_inventory");

  const shop = await getShopById(shopId);
  if (!shop) throw new Error("Shop not found");

  const baseCount = await getNextSkuNumber(shopId);
  const qty = data.quantity ?? 1;

  const newSkus = await db.transaction(async (tx) => {
    const inserted: (typeof skus.$inferSelect)[] = [];

    for (let i = 0; i < qty; i++) {
      const n = baseCount + i;
      const skuCode = buildSkuCode(
        shop.code,
        data.category,
        data.color ?? "",
        n
      );
      const qrData = skuCode;

      const [sku] = await tx
        .insert(skus)
        .values({
          orgId: org.id,
          shopId,
          skuCode,
          qrData,
          category: data.category,
          subCategory: data.subCategory || null,
          color: data.color || null,
          size: data.size || null,
          description: data.description || null,
          costPrice: parsePaise(data.costPrice),
          sellingPrice: parsePaise(data.sellingPrice),
          mrp: parsePaise(data.mrp),
          gstPercent: String(data.gstPercent ?? 0),
          status: "available",
        })
        .returning();

      inserted.push(sku);
    }

    await tx.insert(auditLogs).values({
      orgId: org.id,
      shopId,
      userId: user.id,
      action: "sku.batch_created",
      entity: "sku",
      changes: { qty, category: data.category } as Record<string, unknown>,
    });

    return inserted;
  });

  revalidatePath(`/workspace/${orgSlug}/${shopId}/inventory`);
  return newSkus;
}

export async function editSku(
  orgSlug: string,
  shopId: string,
  skuId: string,
  data: EditSkuInput
) {
  const user = await requireAuth();
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) throw new Error("Organization not found");

  await requireShopPermission(user.id, shopId, org.id, "manage_inventory");

  const updates: Record<string, unknown> = {};
  if (data.category !== undefined) updates.category = data.category;
  if (data.subCategory !== undefined) updates.subCategory = data.subCategory;
  if (data.color !== undefined) updates.color = data.color;
  if (data.size !== undefined) updates.size = data.size;
  if (data.description !== undefined) updates.description = data.description;
  if (data.costPrice !== undefined) updates.costPrice = parsePaise(data.costPrice);
  if (data.sellingPrice !== undefined) updates.sellingPrice = parsePaise(data.sellingPrice);
  if (data.mrp !== undefined) updates.mrp = parsePaise(data.mrp);
  if (data.gstPercent !== undefined) updates.gstPercent = String(data.gstPercent);
  if (data.status !== undefined) updates.status = data.status;

  const [updated] = await db
    .update(skus)
    .set(updates as Parameters<typeof db.update>[0] extends any ? any : never)
    .where(and(eq(skus.id, skuId), eq(skus.shopId, shopId)))
    .returning();

  if (!updated) throw new Error("SKU not found");

  revalidatePath(`/workspace/${orgSlug}/${shopId}/inventory`);
  return updated;
}

export async function deleteSku(
  orgSlug: string,
  shopId: string,
  skuId: string
) {
  const user = await requireAuth();
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) throw new Error("Organization not found");

  await requireShopPermission(user.id, shopId, org.id, "manage_inventory");

  const [deleted] = await db
    .delete(skus)
    .where(and(eq(skus.id, skuId), eq(skus.shopId, shopId)))
    .returning();

  if (!deleted) throw new Error("SKU not found");

  await db.insert(auditLogs).values({
    orgId: org.id,
    shopId,
    userId: user.id,
    action: "sku.deleted",
    entity: "sku",
    entityId: skuId,
  });

  revalidatePath(`/workspace/${orgSlug}/${shopId}/inventory`);
}
