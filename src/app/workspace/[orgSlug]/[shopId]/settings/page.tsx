import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById } from "@/db/queries/shops.queries";
import { getUserOrgRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store, Phone, Mail, MapPin, Hash } from "lucide-react";

interface Props {
  params: { orgSlug: string; shopId: string };
}

export default async function ShopSettingsPage({ params }: Props) {
  const user = await requireAuth();

  const org = await getOrganizationBySlug(params.orgSlug);
  if (!org) redirect("/workspace");

  const role = await getUserOrgRole(user.id, org.id);
  if (!role) redirect("/workspace");

  const shop = await getShopById(params.shopId);
  if (!shop || shop.orgId !== org.id) redirect("/workspace");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shop Settings</h1>
        <p className="text-muted-foreground">Configure details and preferences for {shop.name}.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Public identity of your shop.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Shop Name</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="name" defaultValue={shop.name} className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Shop Code</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="code" defaultValue={shop.code} className="pl-9 bg-muted/50" disabled />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Code is used for internal tracking.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" defaultValue={shop.phone || ""} className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" defaultValue={shop.email || ""} className="pl-9" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea 
                      id="address" 
                      className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-9 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter full address..."
                      defaultValue={typeof shop.address === 'string' ? shop.address : JSON.stringify(shop.address)}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit">Update Shop</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Manage shop visibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Status</p>
                  <p className="text-xs text-muted-foreground">{shop.isActive ? "Currently accepting sales" : "Shop is offline"}</p>
                </div>
                <Badge variant={shop.isActive ? "default" : "secondary"}>
                  {shop.isActive ? "Online" : "Offline"}
                </Badge>
              </div>
              <Button variant="outline" className="w-full text-xs h-8">
                {shop.isActive ? "Deactivate Shop" : "Activate Shop"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-sm text-destructive font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" className="w-full text-xs">Archive Shop</Button>
              <p className="text-[10px] text-center mt-2 text-muted-foreground">Archiving will hide all data.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
