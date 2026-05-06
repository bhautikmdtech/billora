import { db } from "@/db";
import { invites, auditLogs, organizations, profiles } from "@/db/schema";
import { requireOrgRole, getUserOrgRole } from "@/lib/permissions";
import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import { sendInviteEmail } from "@/lib/email";
import { z } from "zod";
import { eq } from "drizzle-orm";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["partner", "admin", "employee"]),
  shopId: z.string().uuid().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner", "admin"], user.id, params.orgId);

    const body = await req.json();
    const validated = schema.parse(body);

    // Admins can only invite employees
    const inviterRole = await getUserOrgRole(user.id, params.orgId);
    if (inviterRole === "admin" && validated.role !== "employee") {
      return handleError(Object.assign(new Error("Admins can only invite employees"), { status: 403 }));
    }

    // Check for existing pending invite
    const existing = await db.query.invites.findFirst({
      where: (t, { and, eq }) =>
        and(
          eq(t.orgId, params.orgId),
          eq(t.invitedEmail, validated.email),
          eq(t.status, "pending")
        ),
    });
    if (existing) {
      return handleError(Object.assign(new Error("A pending invite already exists for this email"), { status: 409 }));
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, params.orgId));

    const [inviterProfile] = await db
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, user.id));

    const [invite] = await db
      .insert(invites)
      .values({
        orgId: params.orgId,
        shopId: validated.shopId,
        invitedEmail: validated.email,
        role: validated.role,
        token,
        invitedBy: user.id,
        expiresAt,
      })
      .returning();

    await db.insert(auditLogs).values({
      orgId: params.orgId,
      shopId: validated.shopId,
      userId: user.id,
      action: "invite.sent",
      entity: "invite",
      entityId: invite.id,
    });

    void sendInviteEmail({
      to: validated.email,
      orgName: org.name,
      role: validated.role,
      inviterName: inviterProfile?.fullName ?? user.email ?? "Your teammate",
      token,
    });

    return ok(invite);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner", "admin"], user.id, params.orgId);

    const orgInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.orgId, params.orgId))
      .orderBy(invites.createdAt);

    return ok(orgInvites);
  } catch (err) {
    return handleError(err);
  }
}
