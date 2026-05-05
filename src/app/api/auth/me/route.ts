import { fail, getRequestLogger, ok } from "@/lib/http";
import { ensureProfile, getAuthenticatedUser, getCurrentUserContext } from "@/lib/supabase/auth";

export async function GET() {
  const logger = getRequestLogger("/api/auth/me");

  try {
    const user = await getAuthenticatedUser();
    await ensureProfile(user.id, {
      fullName:
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "New User",
      phone: user.user_metadata?.phone as string | undefined,
    });

    const context = await getCurrentUserContext(user.id);

    return ok({
      user: {
        id: user.id,
        email: user.email,
      },
      ...context,
    });
  } catch (error) {
    logger.error({ error }, "Failed to load auth context");
    return fail("Unauthorized", 401);
  }
}
