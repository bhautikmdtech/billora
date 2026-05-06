import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById } from "@/db/queries/shops.queries";
import { getUserOrgRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaise, formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Plus, Package, Filter } from "lucide-react";
import { InventoryClient } from "./inventory-client";
import { AddSkuDialog } from "@/components/workspace/inventory/add-sku-dialog";
import { serverEnv } from "@/lib/env/server";
import { cookies } from "next/headers";

interface Props {
  params: { orgSlug: string; shopId: string };
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
    status?: string;
  };
}

export default async function InventoryPage({ params, searchParams }: Props) {
  const user = await requireAuth();

  const org = await getOrganizationBySlug(params.orgSlug);
  if (!org) redirect("/workspace");

  const role = await getUserOrgRole(user.id, org.id);
  if (!role) redirect("/workspace");

  const shop = await getShopById(params.shopId);
  if (!shop || shop.orgId !== org.id) redirect("/workspace");

  const page = Math.max(parseInt(searchParams.page || "1"), 1);
  const search = searchParams.search || "";
  
  // Call API for getting data
  const apiParams = new URLSearchParams({
    page: page.toString(),
    search,
    category: searchParams.category || "",
    status: searchParams.status || "",
  });

  const apiUrl = `${serverEnv.NEXT_PUBLIC_APP_URL}/api/orgs/${org.id}/shops/${shop.id}/skus?${apiParams}`;
  const response = await fetch(apiUrl, {
    headers: {
      Cookie: cookies().toString(),
    },
    next: { tags: [`inventory-${shop.id}`] }
  });

  const resData = await response.json();
  const inventory = resData.data || [];
  const meta = resData.meta;
  const totalPages = meta?.pages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">Manage products for {shop.name}.</p>
        </div>
        <AddSkuDialog orgId={org.id} shopId={params.shopId} />
      </div>

      <Card className="rounded-lg shadow-sm border-border/60 overflow-hidden">
        <CardHeader className="py-2.5 px-4 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <form action="" method="GET">
                <Input 
                  name="search"
                  defaultValue={search}
                  placeholder="Search SKU or description..." 
                  className="pl-8 h-8 text-[13px]"
                />
              </form>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" className="h-8 text-[13px] font-medium">
                <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View (TanStack Table) */}
          <div className="hidden md:block">
            <InventoryClient data={inventory} />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-3 space-y-3">
            {inventory?.length === 0 ? (
              <div className="text-center py-8 text-[13px] text-muted-foreground border rounded-lg bg-muted/10">
                No items found in inventory.
              </div>
            ) : (
              inventory?.map((item: any) => (
                <div key={item.id} className="border border-border/60 rounded-lg p-3 space-y-2.5 bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[14px] tracking-tight">{item.skuCode}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.category || "General"}</p>
                    </div>
                    <Badge variant={item.status === "available" ? "default" : "secondary"} className="text-[10px] h-5 px-1.5 font-bold uppercase">
                      {item.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border/40">
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Cost</p>
                      <p className="text-xs font-semibold">{formatPaise(item.costPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Selling</p>
                      <p className="text-xs font-bold text-emerald-600">{formatPaise(item.sellingPrice)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <p className="text-[11px] font-bold text-muted-foreground">
                  PAGE {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" asChild={page > 1} disabled={page <= 1}>
                    {page > 1 ? (
                      <Link href={`/workspace/${params.orgSlug}/${params.shopId}/inventory?page=${page - 1}&search=${search}`}>
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    ) : (
                      <ChevronLeft className="h-4 w-4 opacity-30" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" asChild={page < totalPages} disabled={page >= totalPages}>
                    {page < totalPages ? (
                      <Link href={`/workspace/${params.orgSlug}/${params.shopId}/inventory?page=${page + 1}&search=${search}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-30" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
