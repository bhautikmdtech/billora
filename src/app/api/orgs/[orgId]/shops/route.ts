import { z } from "zod";

import { createShop, listShopsByOrg } from "@/db/queries";
import { fail, getRequestLogger, ok, parseJson } from "@/lib/http";

const createShopSchema = z.object({
  name: z.string().min(2).max(120),
  code: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, or hyphens only"),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().optional(),
});

export async function GET(
  _request: Request,
  context: { params: { orgId: string } }
) {
  const logger = getRequestLogger("/api/orgs/[orgId]/shops");

  try {
    const shops = await listShopsByOrg(context.params.orgId);
    return ok(shops);
  } catch (error) {
    logger.error({ error }, "Failed to load shops");
    return fail("Unable to load shops", 500);
  }
}

export async function POST(
  request: Request,
  context: { params: { orgId: string } }
) {
  const logger = getRequestLogger("/api/orgs/[orgId]/shops");

  try {
    const payload = await parseJson(request, createShopSchema);
    const shop = await createShop({
      orgId: context.params.orgId,
      ...payload,
    });
    return ok(shop);
  } catch (error) {
    logger.error({ error }, "Failed to create shop");
    return fail(
      error instanceof z.ZodError ? error.issues[0]?.message ?? "Invalid input" : "Unable to create shop",
      error instanceof z.ZodError ? 422 : 500
    );
  }
}
