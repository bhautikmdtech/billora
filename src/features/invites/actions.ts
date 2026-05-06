"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { orgMembers, shopMembers, invites, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getInviteByToken } from "@/db/queries/invites.queries";
import { setupProfile } from "@/features/auth/actions";

export async function acceptInvite(
  token: string,
  data: { fullName?: string; password?: string }
) {
  const inviteData = await getInviteByToken(token);

  if (!inviteData) throw new Error("Invite not found");
  if (inviteData.invite.status !== "pending") {
    throw new Error(`Invite already ${inviteData.invite.status}`);
  }
  if (new Date() > new Date(inviteData.invite.expiresAt)) {
    await db.update(invites).set({ status: "expired" }).where(eq(invites.token, token));
    throw new Error("Invite has expired");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let userId: string;

  if (currentUser) {
    if (currentUser.email !== inviteData.invite.invitedEmail) {
      throw new Error(
        `This invite is for ${inviteData.invite.invitedEmail}. Log in with that account first.`
      );
    }
    userId = currentUser.id;
  } else {
    if (!data.password) throw new Error("Password is required for new accounts");

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const exists = existingUsers?.users?.find(
      (u) => u.email === inviteData.invite.invitedEmail
    );
    if (exists) {
      throw new Error("An account with this email already exists. Log in first.");
    }

    const { data: newUserData, error } = await supabaseAdmin.auth.admin.createUser({
      email: inviteData.invite.invitedEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (error || !newUserData.user) {
      throw new Error(error?.message ?? "Failed to create account");
    }

    userId = newUserData.user.id;
    await setupProfile({
      userId,
      fullName: data.fullName ?? inviteData.invite.invitedEmail.split("@")[0],
    });
  }

  const existingMember = await db.query.orgMembers.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.orgId, inviteData.invite.orgId), eq(t.userId, userId)),
  });

  await db.transaction(async (tx) => {
    if (!existingMember) {
      await tx.insert(orgMembers).values({
        orgId: inviteData.invite.orgId,
        userId,
        role: inviteData.invite.role as "org_owner" | "partner" | "admin" | "employee",
        invitedBy: inviteData.invite.invitedBy ?? undefined,
      });

      if (inviteData.invite.shopId) {
        await tx.insert(shopMembers).values({
          orgId: inviteData.invite.orgId,
          shopId: inviteData.invite.shopId,
          userId,
          role: "employee",
        });
      }
    }

    await tx
      .update(invites)
      .set({ status: "accepted" })
      .where(eq(invites.token, token));

    await tx.insert(auditLogs).values({
      orgId: inviteData.invite.orgId,
      shopId: inviteData.invite.shopId ?? undefined,
      userId,
      action: "member.invite_accepted",
      entity: "invite",
      entityId: inviteData.invite.id,
    });
  });

  redirect(`/workspace/${inviteData.organization.slug}`);
}
