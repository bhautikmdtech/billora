import { NextResponse } from "next/server";
import { handleError } from "@/lib/http";
import { db } from "@/db";
import { orgMembers, shopMembers, auditLogs, invites } from "@/db/schema";
import { getInviteByToken } from "@/db/queries/invites.queries";
import { upsertProfile } from "@/db/queries/profiles.queries";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { eq } from "drizzle-orm";

const schema = z.object({
  fullName: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json();
    const validated = schema.parse(body);

    const inviteData = await getInviteByToken(params.token);

    if (!inviteData) {
      return NextResponse.json({ success: false, error: "Invite not found" }, { status: 404 });
    }

    if (inviteData.invite.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Invite already ${inviteData.invite.status}` },
        { status: 400 }
      );
    }

    if (new Date() > new Date(inviteData.invite.expiresAt)) {
      await db.update(invites).set({ status: "expired" }).where(eq(invites.token, params.token));
      return NextResponse.json({ success: false, error: "Invite has expired" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    let userId: string;

    if (currentUser) {
      // Already logged in — check the email matches
      if (currentUser.email !== inviteData.invite.invitedEmail) {
        return NextResponse.json(
          {
            success: false,
            error: `This invite is for ${inviteData.invite.invitedEmail}. Please log in with that account.`,
          },
          { status: 403 }
        );
      }
      userId = currentUser.id;
    } else {
      // New user — register via admin API to bypass email confirmation
      if (!validated.password) {
        return NextResponse.json(
          { success: false, error: "Password is required for new accounts" },
          { status: 400 }
        );
      }

      // Check if user already exists in Supabase
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === inviteData.invite.invitedEmail
      );

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email already exists. Please log in first.",
          },
          { status: 409 }
        );
      }

      // Create user via admin (email already verified — they clicked the invite link)
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: inviteData.invite.invitedEmail,
        password: validated.password,
        email_confirm: true,
        user_metadata: {
          full_name: validated.fullName ?? inviteData.invite.invitedEmail.split("@")[0],
        },
      });

      if (createError || !newUserData.user) {
        return NextResponse.json(
          { success: false, error: createError?.message ?? "Failed to create account" },
          { status: 400 }
        );
      }

      userId = newUserData.user.id;

      await upsertProfile({
        id: userId,
        fullName: validated.fullName ?? inviteData.invite.invitedEmail.split("@")[0],
      });
    }

    // Check if user is already a member of this org
    const existingMember = await db.query.orgMembers.findFirst({
      where: (t, { and, eq }) => and(eq(t.orgId, inviteData.invite.orgId), eq(t.userId, userId)),
    });

    if (existingMember) {
      // Just mark invite accepted, user is already a member
      await db.update(invites).set({ status: "accepted" }).where(eq(invites.token, params.token));
      return NextResponse.json({
        success: true,
        data: { org: inviteData.organization, shop: inviteData.shop },
      });
    }

    await db.transaction(async (tx) => {
      await tx.insert(orgMembers).values({
        orgId: inviteData.invite.orgId,
        userId,
        role: inviteData.invite.role as any,
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

      await tx.update(invites).set({ status: "accepted" }).where(eq(invites.token, params.token));

      await tx.insert(auditLogs).values({
        orgId: inviteData.invite.orgId,
        shopId: inviteData.invite.shopId ?? undefined,
        userId,
        action: "member.invite_accepted",
        entity: "invite",
        entityId: inviteData.invite.id,
      });
    });

    return NextResponse.json({
      success: true,
      data: { org: inviteData.organization, shop: inviteData.shop },
    });
  } catch (err) {
    return handleError(err);
  }
}
