import { db } from "@/db";
import { organizations, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireOrgRole } from "@/lib/permissions";
import { ok, handleError } from "@/lib/http";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  address: z.any().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner", "admin"], user.id, params.orgId);

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, params.orgId));

    if (!org) return handleError(Object.assign(new Error("Organization not found"), { status: 404 }));
    return ok(org);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner"], user.id, params.orgId);

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const [updated] = await db
      .update(organizations)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(organizations.id, params.orgId))
      .returning();

    await db.insert(auditLogs).values({
      orgId: params.orgId,
      userId: user.id,
      action: "org.updated",
      entity: "organization",
      entityId: params.orgId,
      changes: validated as any,
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
