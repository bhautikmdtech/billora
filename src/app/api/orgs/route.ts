import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import { getUserOrganizations } from "@/db/queries/orgs.queries";
import { db } from "@/db";
import { shops, orgMembers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireAuth();
    const userOrgs = await getUserOrganizations(user.id);

    const orgsWithDetails = await Promise.all(
      userOrgs.map(async ({ organization, role }) => {
        const [shopCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(shops)
          .where(eq(shops.orgId, organization.id));

        const [memberCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(orgMembers)
          .where(eq(orgMembers.orgId, organization.id));

        return {
          ...organization,
          role,
          shopCount: Number(shopCount.count),
          memberCount: Number(memberCount.count),
        };
      })
    );

    return ok(orgsWithDetails);
  } catch (err) {
    return handleError(err);
  }
}
