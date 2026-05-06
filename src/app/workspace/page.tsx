import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getUserOrganizations } from "@/db/queries/orgs.queries";
import { getUserShops } from "@/db/queries/shops.queries";
import { isSuperadmin } from "@/lib/permissions";

export default async function WorkspacePage() {
  const user = await requireAuth();

  if (isSuperadmin(user.email)) {
    redirect("/superadmin");
  }

  const orgs = await getUserOrganizations(user.id);

  if (orgs.length === 0) {
    redirect("/onboarding/org");
  }

  const firstOrg = orgs[0].organization;
  const shops = await getUserShops(user.id, firstOrg.id);

  if (shops.length === 0) {
    redirect(`/workspace/${firstOrg.slug}/settings/shops`);
  }

  redirect(`/workspace/${firstOrg.slug}/${shops[0].shop.id}/dashboard`);
}
