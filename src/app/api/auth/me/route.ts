import { NextResponse } from "next/server";
import { requireAuth, getUserProfile } from "@/lib/auth";
import { getUserOrganizations } from "@/db/queries/orgs.queries";
import { getUserShops } from "@/db/queries/shops.queries";

export async function GET() {
  try {
    const user = await requireAuth();
    const profile = await getUserProfile(user.id);

    if (!profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const orgs = await getUserOrganizations(user.id);

    const orgsWithShops = await Promise.all(
      orgs.map(async ({ organization, role }) => ({
        org: organization,
        role,
        shops: await getUserShops(user.id, organization.id),
      }))
    );

    return NextResponse.json({
      success: true,
      data: { profile, orgs: orgsWithShops },
    });
  } catch (err: any) {
    if (err?.status) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
