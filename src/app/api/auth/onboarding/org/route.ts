import { z } from "zod";

import { createOrganizationWithOwner } from "@/db/queries";
import { fail, getRequestLogger, ok, parseJson } from "@/lib/http";
import { ensureProfile, getAuthenticatedUser } from "@/lib/supabase/auth";

const schema = z.object({
  orgName: z.string().min(2).max(120),
  category: z.enum([
    "saree",
    "dress",
    "kariyana",
    "jewellery",
    "electronics",
    "hardware",
    "general",
  ]),
  shopName: z.string().min(2).max(120),
  shopCode: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Za-z0-9-]+$/),
});

export async function POST(request: Request) {
  const logger = getRequestLogger("/api/auth/onboarding/org");

  try {
    const user = await getAuthenticatedUser();
    const payload = await parseJson(request, schema);

    await ensureProfile(user.id, {
      fullName:
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "New User",
      phone: user.user_metadata?.phone as string | undefined,
    });

    const result = await createOrganizationWithOwner({
      userId: user.id,
      orgName: payload.orgName,
      category: payload.category,
      shopName: payload.shopName,
      shopCode: payload.shopCode,
      email: user.email,
      phone: (user.user_metadata?.phone as string | undefined) || undefined,
    });

    return ok(result);
  } catch (error) {
    logger.error({ error }, "Failed to onboard organization");
    return fail("Unable to create organization", 500);
  }
}

