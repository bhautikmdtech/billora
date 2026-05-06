"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";

export default function SubscriptionSettingsPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // First get org to get orgId
        const orgRes = await api.get<any>(`/api/orgs/by-slug/${params.orgSlug}`);
        if (!orgRes.success) throw new Error("Org not found");
        setOrg(orgRes.data);

        const response = await api.get<any>(`/api/orgs/${orgRes.data.id}/subscription`);
        if (response.success) {
          setData(response.data);
        }
      } catch (err) {
        toast.error("Failed to fetch subscription data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.orgSlug]);

  async function handlePortal() {
    try {
      const response = await api.post<any>("/api/stripe/portal", { orgId: org.id });
      if (response.success) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      toast.error("Failed to open billing portal");
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No subscription found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your plan and billing information.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan: {data.plan}</CardTitle>
            <Badge variant={data.subscription?.status === 'active' ? 'default' : 'secondary'}>
              {data.subscription?.status || 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.subscription?.currentPeriodEnd && (
              <p>Next billing date: {formatDateShort(data.subscription.currentPeriodEnd)}</p>
            )}
            <div className="flex gap-4">
              <Button onClick={handlePortal}>Manage Billing & Invoices</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Shops</p>
              <p className="text-xl font-bold">{data.limits.shops === -1 ? 'Unlimited' : data.limits.shops}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">SKUs</p>
              <p className="text-xl font-bold">{data.limits.skus === -1 ? 'Unlimited' : data.limits.skus}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Exports</p>
              <p className="text-xl font-bold">{data.limits.exports ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
