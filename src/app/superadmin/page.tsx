import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { isSuperadmin } from "@/lib/permissions";
import { db } from "@/db";
import { organizations, shops, profiles, subscriptions } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, Users, CreditCard } from "lucide-react";

export default async function SuperadminPage() {
  const user = await requireAuth();
  
  if (user.email !== process.env.SUPERADMIN_EMAIL) {
    redirect("/workspace");
  }

  const [orgCount] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
  const [shopCount] = await db.select({ count: sql<number>`count(*)` }).from(shops);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles);
  const [activeSubs] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(sql`${subscriptions.status} = 'active'`);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Superadmin Dashboard</h1>
        <p className="text-muted-foreground">Global overview of the Billora ERP platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Organizations" value={Number(orgCount.count)} icon={<Building2 />} />
        <MetricCard title="Total Shops" value={Number(shopCount.count)} icon={<Store />} />
        <MetricCard title="Total Users" value={Number(userCount.count)} icon={<Users />} />
        <MetricCard title="Active Subscriptions" value={Number(activeSubs.count)} icon={<CreditCard />} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: number; icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
