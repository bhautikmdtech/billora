import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById } from "@/db/queries/shops.queries";
import { getUserOrgRole } from "@/lib/permissions";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq, and, ilike, desc, count, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaise, formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Plus, CreditCard, Filter } from "lucide-react";
import { ExpensesClient } from "./expenses-client";
import { AddExpenseDialog } from "@/components/workspace/expenses/add-expense-dialog";

interface Props {
  params: { orgSlug: string; shopId: string };
  searchParams: {
    page?: string;
    category?: string;
  };
}

export default async function ExpensesPage({ params, searchParams }: Props) {
  const user = await requireAuth();

  const org = await getOrganizationBySlug(params.orgSlug);
  if (!org) redirect("/workspace");

  const role = await getUserOrgRole(user.id, org.id);
  if (!role) redirect("/workspace");

  const shop = await getShopById(params.shopId);
  if (!shop || shop.orgId !== org.id) redirect("/workspace");

  const page = Math.max(parseInt(searchParams.page || "1"), 1);
  const limit = 10;
  const category = searchParams.category || "";
  const skip = (page - 1) * limit;

  const whereClause = and(
    eq(expenses.shopId, params.shopId),
    category ? eq(expenses.category, category as any) : undefined
  );

  const [totalCount] = await db
    .select({ count: count() })
    .from(expenses)
    .where(whereClause);

  const expenseList = await db
    .select()
    .from(expenses)
    .where(whereClause)
    .orderBy(desc(expenses.date))
    .limit(limit)
    .offset(skip);

  const [totalExpenses] = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(eq(expenses.shopId, params.shopId));

  const totalPages = Math.ceil(totalCount.count / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm">Track daily overheads and spending for {shop.name}.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Expenses</p>
            <p className="text-xl font-bold">{formatPaise(Number(totalExpenses.total))}</p>
          </div>
          <AddExpenseDialog orgId={org.id} shopId={params.shopId} />
        </div>
      </div>

      <div className="md:hidden bg-muted/30 rounded-xl p-4 flex justify-between items-center border">
        <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
        <p className="text-lg font-bold">{formatPaise(Number(totalExpenses.total))}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex gap-2 overflow-x-auto w-full pb-1 md:pb-0">
              <Button variant="outline" size="sm" className="whitespace-nowrap">All</Button>
              {["salary", "rent", "electricity", "transport", "maintenance", "misc"].map((cat) => (
                <Button key={cat} variant="ghost" size="sm" className="whitespace-nowrap capitalize">
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table (TanStack Table) */}
          <div className="hidden md:block">
            <ExpensesClient data={expenseList as any} />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {expenseList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No expenses found.
              </div>
            ) : (
              expenseList.map((e) => (
                <div key={e.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground">{formatDateShort(e.date)}</p>
                      <p className="font-bold text-lg mt-0.5">{formatPaise(e.amount)}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {e.category}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t text-sm">
                    <p className="font-medium">{e.description || "No description"}</p>
                    {e.paidTo && <p className="text-xs text-muted-foreground mt-1">Paid to: {e.paidTo}</p>}
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
                    <Link href={`/workspace/${params.orgSlug}/${params.shopId}/expenses?page=${page - 1}&category=${category}`}>
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
                    <Link href={`/workspace/${params.orgSlug}/${params.shopId}/expenses?page=${page + 1}&category=${category}`}>
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
