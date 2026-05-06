import { NextResponse } from "next/server";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { getInviteByToken } from "@/db/queries/invites.queries";
import { requireOrgRole } from "@/lib/permissions";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
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

    return NextResponse.json({ success: true, data: inviteData });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const user = await requireAuth();

    const inviteData = await getInviteByToken(params.token);
    if (!inviteData) {
      return NextResponse.json({ success: false, error: "Invite not found" }, { status: 404 });
    }

    await requireOrgRole(["org_owner", "partner", "admin"], user.id, inviteData.invite.orgId);

    await db
      .update(invites)
      .set({ status: "cancelled" })
      .where(eq(invites.token, params.token));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.status) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
