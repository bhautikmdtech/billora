import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { requireShopPermission } from "@/lib/permissions";

interface Props {
  params: Promise<{ orgSlug: string; shopId: string }>;
}

export default async function EmployeesPage({ params }: Props) {
  const { orgSlug, shopId } = await params;
  const user = await requireAuth();
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/workspace");
  await requireShopPermission(user.id, shopId, org.id, "manage_employees");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Employees</h1>
      <p className="mt-1 text-muted-foreground">Attendance, salary, and payroll management.</p>
    </div>
  );
}
