import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { fail, getRequestLogger, ok, parseJson } from "@/lib/http";
import { ensureProfile, getAuthenticatedUser } from "@/lib/supabase/auth";

const schema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(8).max(20).optional(),
});

export async function POST(request: Request) {
  const logger = getRequestLogger("/api/auth/complete-profile");

  try {
    const user = await getAuthenticatedUser();
    const payload = await parseJson(request, schema);

    await ensureProfile(user.id, {
      fullName: payload.fullName,
      phone: payload.phone,
    });

    const [profile] = await db
      .update(profiles)
      .set({
        fullName: payload.fullName,
        phone: payload.phone ?? null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id))
      .returning();

    return ok(profile);
  } catch (error) {
    logger.error({ error }, "Failed to complete profile");
    return fail("Unable to complete profile", 500);
  }
}

