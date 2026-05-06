import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { requireShopPermission } from "@/lib/permissions";

interface Props {
  params: Promise<{ orgSlug: string; shopId: string }>;
}

export default async function SuppliersPage({ params }: Props) {
  const { orgSlug, shopId } = await params;
  const user = await requireAuth();
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/workspace");
  await requireShopPermission(user.id, shopId, org.id, "manage_suppliers");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Suppliers</h1>
      <p className="mt-1 text-muted-foreground">Manage your supplier contacts and balances.</p>
    </div>
  );
}
