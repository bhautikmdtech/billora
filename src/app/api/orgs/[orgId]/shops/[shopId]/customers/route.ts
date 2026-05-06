import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { parsePaginationParams, buildMeta } from "@/lib/pagination";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { getShopCustomers, upsertCustomer } from "@/db/queries/customers.queries";
import { handleError } from "@/lib/http";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  address: z.any().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const search = searchParams.get("search") || undefined;

    const data = await getShopCustomers(params.shopId, search, limit, skip);

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.shopId, params.shopId));

    return NextResponse.json({
      success: true,
      data,
      meta: buildMeta(Number(totalRes.count), page, limit),
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const body = await req.json();
    const validated = schema.parse(body);

    const customer = await upsertCustomer({
      ...validated,
      orgId: params.orgId,
      shopId: params.shopId,
      email: validated.email || null,
      whatsapp: validated.whatsapp || validated.phone,
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (err) {
    return handleError(err);
  }
}
