import { redirect } from "next/navigation";
import { requireAuth, getUserProfile } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { getShopById, getOrganizationShops } from "@/db/queries/shops.queries";
import { getUserOrgRole } from "@/lib/permissions";
import { Sidebar } from "@/components/workspace/sidebar";

interface Props {
  children: React.ReactNode;
  params: { orgSlug: string; shopId: string };
}

export default async function ShopLayout({ children, params }: Props) {
  const user = await requireAuth();
  const profile = await getUserProfile(user.id);

  const org = await getOrganizationBySlug(params.orgSlug);
  if (!org) redirect("/workspace");

  const role = await getUserOrgRole(user.id, org.id);
  if (!role) redirect("/workspace");

  const shop = await getShopById(params.shopId);
  if (!shop || shop.orgId !== org.id) redirect(`/workspace`);

  const allShops = await getOrganizationShops(org.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        orgName={org.name}
        orgSlug={org.slug}
        shopId={shop.id}
        shopName={shop.name}
        userEmail={user.email ?? ""}
        userName={profile?.fullName ?? user.email ?? "User"}
        shops={allShops.map((s) => ({ id: s.id, name: s.name }))}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
