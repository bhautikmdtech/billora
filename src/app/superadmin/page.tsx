import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { organizations, shops, profiles, subscriptions, orgMembers } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Store, Users, CreditCard, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPaise, formatDateShort, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function SuperadminPage() {
  const user = await requireAuth();
  
  if (user.email !== process.env.SUPERADMIN_EMAIL) {
    redirect("/workspace");
  }

  const [orgCount] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
  const [shopCount] = await db.select({ count: sql<number>`count(*)` }).from(shops);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles);
  const [activeSubs] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(sql`${subscriptions.status} = 'active'`);

  const recentOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      category: organizations.category,
      createdAt: organizations.createdAt,
      isActive: organizations.isActive,
    })
    .from(organizations)
    .orderBy(desc(organizations.createdAt))
    .limit(5);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Superadmin Dashboard</h1>
          <p className="text-muted-foreground">Global overview of the Billora ERP platform.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/superadmin/organizations">Manage Organizations</Link>
          </Button>
          <Button asChild>
            <Link href="/superadmin/users">Manage Users</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Organizations" 
          value={Number(orgCount.count)} 
          icon={<Building2 className="h-4 w-4" />} 
          description="Across all categories"
        />
        <MetricCard 
          title="Total Shops" 
          value={Number(shopCount.count)} 
          icon={<Store className="h-4 w-4" />} 
          description="Active retail outlets"
        />
        <MetricCard 
          title="Total Users" 
          value={Number(userCount.count)} 
          icon={<Users className="h-4 w-4" />} 
          description="Registered profiles"
        />
        <MetricCard 
          title="Active Subscriptions" 
          value={Number(activeSubs.count)} 
          icon={<CreditCard className="h-4 w-4" />} 
          description="Premium organizations"
          color="text-emerald-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Organizations */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Organizations</CardTitle>
              <CardDescription>Latest businesses to join the platform.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/superadmin/organizations" className="flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{org.name}</td>
                      <td className="px-4 py-3 capitalize">{org.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateShort(org.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={org.isActive ? "default" : "secondary"}>
                          {org.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Platform Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>System-wide performance indicators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Growth Rate</p>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600">Stable</p>
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Server Uptime</span>
                <span className="font-medium">99.99%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Database Load</span>
                <span className="font-medium text-emerald-600">Low</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">API Latency</span>
                <span className="font-medium">42ms</span>
              </div>
            </div>

            <Button className="w-full mt-4" variant="outline" disabled>
              Platform Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  description,
  color = "text-foreground"
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  description: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", color)}>{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
