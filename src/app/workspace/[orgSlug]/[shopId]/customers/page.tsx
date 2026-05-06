import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById } from "@/db/queries/shops.queries";
import { getUserOrgRole } from "@/lib/permissions";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, and, ilike, desc, count, or } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPaise, formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, UserPlus, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomersClient } from "./customers-client";
import { AddCustomerDialog } from "@/components/workspace/customers/add-customer-dialog";

interface Props {
  params: { orgSlug: string; shopId: string };
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function CustomersPage({ params, searchParams }: Props) {
  const user = await requireAuth();

  const org = await getOrganizationBySlug(params.orgSlug);
  if (!org) redirect("/workspace");

  const role = await getUserOrgRole(user.id, org.id);
  if (!role) redirect("/workspace");

  const shop = await getShopById(params.shopId);
  if (!shop || shop.orgId !== org.id) redirect("/workspace");

  const page = Math.max(parseInt(searchParams.page || "1"), 1);
  const limit = 10;
  const search = searchParams.search || "";
  const skip = (page - 1) * limit;

  const whereClause = and(
    eq(customers.shopId, params.shopId),
    search ? or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`)) : undefined
  );

  const [totalCount] = await db
    .select({ count: count() })
    .from(customers)
    .where(whereClause);

  const customerList = await db
    .select()
    .from(customers)
    .where(whereClause)
    .orderBy(desc(customers.totalSpend))
    .limit(limit)
    .offset(skip);

  const totalPages = Math.ceil(totalCount.count / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage customer relationships and history for {shop.name}.</p>
        </div>
        <AddCustomerDialog orgId={org.id} shopId={params.shopId} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <form action="" method="GET">
                <Input 
                  name="search"
                  defaultValue={search}
                  placeholder="Search by name or phone..." 
                  className="pl-9"
                />
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table (TanStack Table) */}
          <div className="hidden md:block">
            <CustomersClient data={customerList as any} />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {customerList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No customers found.
              </div>
            ) : (
              customerList.map((c) => (
                <div key={c.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold">{c.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {c.phone || "No phone"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Total Spend</p>
                      <p className="font-bold text-emerald-600">{formatPaise(c.totalSpend)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Visits</p>
                      <p className="font-medium">{c.totalPurchases}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Mobile Pagination */}
            <div className="flex items-center justify-between pt-6 border-t">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={page > 1}
                  disabled={page <= 1}
                  className="h-8 px-2"
                >
                  {page > 1 ? (
                    <Link href={`/workspace/${params.orgSlug}/${params.shopId}/customers?page=${page - 1}&search=${search}`}>
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={page < totalPages}
                  disabled={page >= totalPages}
                  className="h-8 px-2"
                >
                  {page < totalPages ? (
                    <Link href={`/workspace/${params.orgSlug}/${params.shopId}/customers?page=${page + 1}&search=${search}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
