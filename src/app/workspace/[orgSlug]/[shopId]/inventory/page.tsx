import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById } from "@/db/queries/shops.queries";
import { requireShopPermission } from "@/lib/permissions";
import { getShopSkus, getShopCategories, countShopSkusByStatus } from "@/features/inventory/queries";
import { AddSkuDialog } from "@/components/workspace/inventory/add-sku-dialog";
import { InventoryClient } from "./inventory-client";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface Props {
  params: Promise<{ orgSlug: string; shopId: string }>;
  searchParams: Promise<{ page?: string; search?: string; category?: string; status?: string }>;
}

export default async function InventoryPage({ params, searchParams }: Props) {
  const { orgSlug, shopId } = await params;
  const sp = await searchParams;

  const user = await requireAuth();
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/workspace");

  const shop = await getShopById(shopId);
  if (!shop || shop.orgId !== org.id) redirect("/workspace");

  await requireShopPermission(user.id, shopId, org.id, "manage_inventory");

  const page = Math.max(parseInt(sp.page || "1"), 1);

  const [{ data, total, pages }, categories, statusCounts] = await Promise.all([
    getShopSkus(shopId, {
      search: sp.search,
      category: sp.category,
      status: sp.status,
      page,
      limit: 20,
    }),
    getShopCategories(shopId),
    countShopSkusByStatus(shopId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{shop.name}</p>
        </div>
        <AddSkuDialog orgSlug={orgSlug} shopId={shopId} />
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { label: "Available", key: "available", color: "default" },
            { label: "Sold", key: "sold", color: "secondary" },
            { label: "Damaged", key: "damaged", color: "destructive" },
          ] as const
        ).map(({ label, key, color }) => (
          <Badge key={key} variant={color} className="gap-1.5 px-3 py-1 text-xs">
            <Package className="h-3 w-3" />
            {label}: {statusCounts[key] ?? 0}
          </Badge>
        ))}
        <Badge variant="outline" className="px-3 py-1 text-xs">
          Total: {total}
        </Badge>
      </div>

      {/* Table */}
      <InventoryClient
        data={data}
        categories={categories}
        orgSlug={orgSlug}
        shopId={shopId}
        total={total}
        pages={pages}
        page={page}
        search={sp.search ?? ""}
        categoryFilter={sp.category ?? ""}
        statusFilter={sp.status ?? ""}
      />
    </div>
  );
}
