import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ShopDashboardPage({
  params,
}: {
  params: { orgSlug: string; shopId: string };
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shop Dashboard</CardTitle>
            <CardDescription>
              Starter shop route for <span className="font-medium">{params.orgSlug}</span> /
              <span className="font-medium"> {params.shopId}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/workspace">Open workspace</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/app/${params.orgSlug}`}>Back to org</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
