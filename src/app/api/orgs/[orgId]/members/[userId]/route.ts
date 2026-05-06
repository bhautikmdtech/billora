import { NextResponse } from "next/server";
import { db } from "@/db";
import { orgMembers, shopMembers, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireOrgRole } from "@/lib/permissions";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["partner", "admin", "employee"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { orgId: string, userId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner"], user.id, params.orgId);

    const body = await req.json();
    const validated = schema.parse(body);

    if (params.userId === user.id) {
      return NextResponse.json({ success: false, error: "Cannot change your own role" }, { status: 400 });
    }

    const [member] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, params.orgId), eq(orgMembers.userId, params.userId)));

    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    if (member.role === "org_owner") {
      return NextResponse.json({ success: false, error: "Cannot change organization owner role" }, { status: 400 });
    }

    const [updated] = await db
      .update(orgMembers)
      .set({
        ...validated,
      })
      .where(and(eq(orgMembers.orgId, params.orgId), eq(orgMembers.userId, params.userId)))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) { return handleError(err); }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orgId: string, userId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner"], user.id, params.orgId);

    const [member] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, params.orgId), eq(orgMembers.userId, params.userId)));

    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    if (member.role === "org_owner") {
      return NextResponse.json({ success: false, error: "Cannot remove organization owner" }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(orgMembers)
        .where(and(eq(orgMembers.orgId, params.orgId), eq(orgMembers.userId, params.userId)));

      await tx
        .delete(shopMembers)
        .where(and(eq(shopMembers.orgId, params.orgId), eq(shopMembers.userId, params.userId)));

      await tx.insert(auditLogs).values({
        orgId: params.orgId,
        userId: user.id,
        action: "member.removed",
        entity: "user",
        entityId: params.userId,
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
