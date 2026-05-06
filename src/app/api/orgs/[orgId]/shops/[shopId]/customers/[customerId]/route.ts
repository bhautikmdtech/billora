import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { handleError } from "@/lib/http";

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  whatsapp: z.string().optional(),
  address: z.any().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { shopId: string, customerId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, params.customerId), eq(customers.shopId, params.shopId)))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { shopId: string, customerId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const body = await req.json();
    const validated = schema.parse(body);

    const [updated] = await db
      .update(customers)
      .set({
        ...validated,
        email: validated.email === "" ? null : validated.email,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, params.customerId), eq(customers.shopId, params.shopId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { shopId: string, customerId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const [deleted] = await db
      .delete(customers)
      .where(and(eq(customers.id, params.customerId), eq(customers.shopId, params.shopId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
