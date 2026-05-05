import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrgHomePage({
  params,
}: {
  params: { orgSlug: string };
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Workspace</CardTitle>
            <CardDescription>
              Starter route for <span className="font-medium">{params.orgSlug}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={`/app/${params.orgSlug}/settings/shops`}>
                Manage shops
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/workspace">Back to workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

