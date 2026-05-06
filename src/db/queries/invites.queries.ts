import { db } from "@/db";
import { invites, organizations, shops, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getInviteByToken(token: string) {
  const [invite] = await db
    .select({
      invite: invites,
      organization: organizations,
      shop: shops,
      inviter: {
        fullName: profiles.fullName,
      },
    })
    .from(invites)
    .innerJoin(organizations, eq(invites.orgId, organizations.id))
    .leftJoin(shops, eq(invites.shopId, shops.id))
    .leftJoin(profiles, eq(invites.invitedBy, profiles.id))
    .where(eq(invites.token, token))
    .limit(1);
  return invite || null;
}

export async function getOrganizationInvites(orgId: string) {
  return db
    .select()
    .from(invites)
    .where(eq(invites.orgId, orgId));
}

export async function updateInviteStatus(
  id: string,
  status: "pending" | "accepted" | "expired" | "cancelled"
) {
  const [updated] = await db
    .update(invites)
    .set({ status })
    .where(eq(invites.id, id))
    .returning();
  return updated;
}
