import { z } from "zod";
import { NextRequest } from "next/server";

import { createOrganization, listOrganizations } from "@/db/queries";
import { fail, getRequestLogger, ok, parseJson } from "@/lib/http";

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum([
    "saree",
    "dress",
    "kariyana",
    "jewellery",
    "electronics",
    "hardware",
    "general",
  ]),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  const logger = getRequestLogger("/api/orgs");

  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await listOrganizations({
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      search: searchParams.get("search") ?? undefined,
      category: (searchParams.get("category") as
        | z.infer<typeof createOrganizationSchema>["category"]
        | null) ?? undefined,
    });

    return ok(result.rows, result.meta);
  } catch (error) {
    logger.error({ error }, "Failed to list organizations");
    return fail("Unable to load organizations", 500);
  }
}

export async function POST(request: Request) {
  const logger = getRequestLogger("/api/orgs");

  try {
    const payload = await parseJson(request, createOrganizationSchema);
    const organization = await createOrganization(payload);
    return ok(organization);
  } catch (error) {
    logger.error({ error }, "Failed to create organization");
    return fail(
      error instanceof z.ZodError ? error.issues[0]?.message ?? "Invalid input" : "Unable to create organization",
      error instanceof z.ZodError ? 422 : 500
    );
  }
}
