import { NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { parsePaginationParams, buildMeta } from "@/lib/pagination";
import { eq, and, ilike, sql } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const search = searchParams.get("search");

    const whereClauses = [
      eq(suppliers.orgId, params.orgId),
      eq(suppliers.shopId, params.shopId),
      eq(suppliers.isActive, true),
    ];
    if (search) {
      whereClauses.push(ilike(suppliers.name, `%${search}%`));
    }

    const data = await db
      .select()
      .from(suppliers)
      .where(and(...whereClauses))
      .limit(limit)
      .offset(skip);

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(and(...whereClauses));

    return NextResponse.json({
      success: true,
      data,
      meta: buildMeta(Number(totalRes.count), page, limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
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

    const [supplier] = await db
      .insert(suppliers)
      .values({
        ...validated,
        orgId: params.orgId,
        shopId: params.shopId,
      })
      .returning();

    return NextResponse.json({ success: true, data: supplier });
  } catch (err) {
    if (err instanceof z.ZodError) { return handleError(err); }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
