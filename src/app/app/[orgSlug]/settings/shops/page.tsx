import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrgShopsSettingsPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shop Settings</CardTitle>
            <CardDescription>
              This route is reserved for per-organization shop management under
              <span className="font-medium"> /app/{params.orgSlug}/settings/shops</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/app/${params.orgSlug}`}>Back to org home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

