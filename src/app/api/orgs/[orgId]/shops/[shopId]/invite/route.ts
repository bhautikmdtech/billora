import { NextResponse } from "next/server";
import { db } from "@/db";
import { invites, auditLogs, organizations, shops } from "@/db/schema";
import { requireShopRole } from "@/lib/permissions";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "employee"]),
});

export async function POST(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const body = await req.json();
    const validated = schema.parse(body);

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, params.orgId));

    const [invite] = await db
      .insert(invites)
      .values({
        orgId: params.orgId,
        shopId: params.shopId,
        invitedEmail: validated.email,
        role: validated.role,
        token,
        invitedBy: user.id,
        expiresAt,
      })
      .returning();

    await db.insert(auditLogs).values({
      orgId: params.orgId,
      shopId: params.shopId,
      userId: user.id,
      action: "invite.sent",
      entity: "invite",
      entityId: invite.id,
    });

    return NextResponse.json({ success: true, data: invite });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
