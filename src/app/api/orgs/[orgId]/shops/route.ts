import { db } from "@/db";
import { shops, shopMembers, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireOrgRole, getUserOrgRole } from "@/lib/permissions";
import { ok, fail, handleError } from "@/lib/http";
import { getOrgPlan, PLAN_LIMITS } from "@/lib/subscription";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  address: z.any().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await requireAuth();
    const role = await getUserOrgRole(user.id, params.orgId);
    if (!role) return fail("Unauthorized", 401);

    const orgShops = await db
      .select({
        shop: shops,
        memberCount: sql<number>`count(${shopMembers.userId})`,
      })
      .from(shops)
      .leftJoin(shopMembers, eq(shops.id, shopMembers.shopId))
      .where(eq(shops.orgId, params.orgId))
      .groupBy(shops.id);

    return ok(orgShops);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner"], user.id, params.orgId);

    const body = await req.json();
    const validated = createSchema.parse(body);

    // Check subscription plan shop limit
    const plan = await getOrgPlan(params.orgId);
    const limit = PLAN_LIMITS[plan].shops;
    if (limit !== -1) {
      const [currentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(shops)
        .where(eq(shops.orgId, params.orgId));
      if (Number(currentCount.count) >= limit) {
        return fail(`Plan limit reached. Your plan allows ${limit} shops.`, 403);
      }
    }

    // Generate unique 3-letter code
    let code = validated.name.slice(0, 3).toUpperCase();
    const codeExists = await db.query.shops.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.orgId, params.orgId), eq(t.code, code)),
    });
    if (codeExists) {
      code = (validated.name.slice(0, 2) + Math.random().toString(36).slice(2, 3)).toUpperCase();
    }

    const result = await db.transaction(async (tx) => {
      const [shop] = await tx
        .insert(shops)
        .values({
          orgId: params.orgId,
          name: validated.name,
          code,
          address: validated.address,
          phone: validated.phone,
          email: validated.email,
          createdBy: user.id,
        })
        .returning();

      await tx.insert(shopMembers).values({
        orgId: params.orgId,
        shopId: shop.id,
        userId: user.id,
        role: "admin",
      });

      await tx.insert(auditLogs).values({
        orgId: params.orgId,
        shopId: shop.id,
        userId: user.id,
        action: "shop.created",
        entity: "shop",
        entityId: shop.id,
      });

      return shop;
    });

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
