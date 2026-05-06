import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { requireOrgPermission } from "@/lib/permissions";

interface Props {
  params: Promise<{ orgSlug: string; shopId: string }>;
}

export default async function MarketingPage({ params }: Props) {
  const { orgSlug } = await params;
  const user = await requireAuth();
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/workspace");
  await requireOrgPermission(user.id, org.id, "manage_org");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Marketing</h1>
      <p className="mt-1 text-muted-foreground">
        Broadcast WhatsApp messages to your customers.
      </p>
    </div>
  );
}
