import { getDashboardOverview } from "@/db/queries";
import { fail, getRequestLogger, ok } from "@/lib/http";

export async function GET() {
  const logger = getRequestLogger("/api/dashboard/overview");

  try {
    const overview = await getDashboardOverview();
    return ok(overview);
  } catch (error) {
    logger.error({ error }, "Failed to load dashboard overview");
    return fail("Unable to load dashboard overview", 500);
  }
}
