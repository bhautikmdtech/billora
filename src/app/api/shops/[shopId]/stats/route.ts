import { eq } from "drizzle-orm";

import { db } from "@/db";
import { shops } from "@/db/schema";
import { fail, getRequestLogger, ok } from "@/lib/http";

export async function GET(
  _request: Request,
  context: { params: { shopId: string } }
) {
  const logger = getRequestLogger("/api/shops/[shopId]/stats");

  try {
    const [shop] = await db
      .select({
        id: shops.id,
        name: shops.name,
        code: shops.code,
        phone: shops.phone,
        email: shops.email,
        isActive: shops.isActive,
      })
      .from(shops)
      .where(eq(shops.id, context.params.shopId))
      .limit(1);

    if (!shop) {
      return fail("Shop not found", 404);
    }

    return ok(shop);
  } catch (error) {
    logger.error({ error }, "Failed to load shop stats");
    return fail("Unable to load shop stats", 500);
  }
}
