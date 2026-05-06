import { ok, handleError } from "@/lib/http";
import { getOrganizationBySlug } from "@/db/queries/orgs.queries";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // This endpoint is called from client-side to get orgId from orgSlug
    // Requires auth to prevent org enumeration
    await requireAuth();

    const org = await getOrganizationBySlug(params.slug);
    if (!org) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
    }
    return ok(org);
  } catch (err) {
    return handleError(err);
  }
}
