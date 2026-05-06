import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById } from "@/db/queries/shops.queries";
import { getUserOrgRole } from "@/lib/permissions";
import { getShopStats } from "@/db/queries/stats.queries";
import { db } from "@/db";
import { sales, customers } from "@/db/schema";
import { eq, sql, gte, lt, and } from "drizzle-orm";
import { formatPaise, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Package,
  Receipt,
  Users,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, subDays } from "date-fns";

interface Props {
  params: Promise<{ orgSlug: string; shopId: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { orgSlug, shopId } = await params;
  const user = await requireAuth();

  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/workspace");

  const role = await getUserOrgRole(user.id, org.id);
  if (!role) redirect("/workspace");

  const shop = await getShopById(shopId);
  if (!shop || shop.orgId !== org.id) redirect("/workspace");

  const stats = await getShopStats(shopId);

  const sevenDaysAgo = subDays(new Date(), 6);
  const prevMonthStart = startOfMonth(subDays(new Date(), 31));
  const prevMonthEnd = startOfMonth(new Date());

  const [recentSalesList, [prevMonthSales], [customerCount]] = await Promise.all([
    db
      .select({
        id: sales.id,
        billNumber: sales.billNumber,
        grandTotal: sales.grandTotal,
        paymentMethod: sales.paymentMethod,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .where(and(eq(sales.shopId, shopId), gte(sales.createdAt, sevenDaysAgo)))
      .orderBy(sql`${sales.createdAt} DESC`)
      .limit(5),

    db
      .select({ total: sql<number>`coalesce(sum(${sales.grandTotal}), 0)` })
      .from(sales)
      .where(
        and(
          eq(sales.shopId, shopId),
          gte(sales.createdAt, prevMonthStart),
          lt(sales.createdAt, prevMonthEnd)
        )
      ),

    db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.shopId, shopId)),
  ]);

  const growthPct =
    prevMonthSales.total > 0
      ? Math.round(((stats.monthSales.total - Number(prevMonthSales.total)) / Number(prevMonthSales.total)) * 100)
      : 100;

  const metricCards = [
    {
      title: "Today's Revenue",
      value: formatPaise(stats.todaySales.total),
      sub: `${stats.todaySales.count} sales`,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Monthly Revenue",
      value: formatPaise(stats.monthSales.total),
      sub: growthPct >= 0 ? `↑ ${growthPct}% vs last month` : `↓ ${Math.abs(growthPct)}% vs last month`,
      icon: TrendingUp,
      color: growthPct >= 0 ? "text-emerald-500" : "text-red-500",
      bg: growthPct >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      trend: growthPct >= 0 ? "up" : "down",
    },
    {
      title: "Available Stock",
      value: stats.stockAvailable.toLocaleString("en-IN"),
      sub: "items in inventory",
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Customers",
      value: Number(customerCount.count).toLocaleString("en-IN"),
      sub: "registered customers",
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{shop.name} Dashboard</h1>
        <p className="text-muted-foreground text-sm">{org.name} · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </div>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {recentSalesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShoppingBag className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No sales yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSalesList.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between rounded-xl p-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">#{sale.billNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatPaise(sale.grandTotal)}</p>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {sale.paymentMethod ?? "cash"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for today</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: "New Sale", href: `/workspace/${orgSlug}/${shopId}/pos`, icon: ShoppingBag, color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" },
              { label: "Add Stock", href: `/workspace/${orgSlug}/${shopId}/inventory`, icon: Package, color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" },
              { label: "View Sales", href: `/workspace/${orgSlug}/${shopId}/sales`, icon: Receipt, color: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20" },
              { label: "Customers", href: `/workspace/${orgSlug}/${shopId}/customers`, icon: Users, color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center gap-2 rounded-2xl p-4 font-medium text-sm transition-colors ${action.color}`}
              >
                <action.icon className="h-6 w-6" />
                {action.label}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Today's summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today at a Glance</CardTitle>
          <CardDescription>Summary for {shop.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sales Revenue", value: formatPaise(stats.todaySales.total) },
              { label: "Bills Generated", value: stats.todaySales.count.toString() },
              { label: "Expenses", value: formatPaise(stats.todayExpenses) },
              {
                label: "Net Cash",
                value: formatPaise(stats.todaySales.total - stats.todayExpenses),
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
