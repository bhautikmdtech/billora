import { db } from "@/db";
import { orgMembers, profiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireOrgRole } from "@/lib/permissions";
import { ok, handleError } from "@/lib/http";
import { parsePaginationParams, buildMeta } from "@/lib/pagination";
import { eq, and, ilike, sql } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const user = await requireAuth();
    await requireOrgRole(["org_owner", "partner", "admin"], user.id, params.orgId);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const conditions = [eq(orgMembers.orgId, params.orgId)];
    if (role) conditions.push(eq(orgMembers.role, role as any));
    if (status) conditions.push(eq(orgMembers.status, status as any));

    const members = await db
      .select({
        id: orgMembers.id,
        role: orgMembers.role,
        status: orgMembers.status,
        joinedAt: orgMembers.joinedAt,
        profile: {
          id: profiles.id,
          fullName: profiles.fullName,
          avatarUrl: profiles.avatarUrl,
          phone: profiles.phone,
        },
      })
      .from(orgMembers)
      .innerJoin(profiles, eq(orgMembers.userId, profiles.id))
      .where(and(...conditions, ...(search ? [ilike(profiles.fullName, `%${search}%`)] : [])))
      .orderBy(sql`${orgMembers.joinedAt} DESC`)
      .limit(limit)
      .offset(skip);

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orgMembers)
      .innerJoin(profiles, eq(orgMembers.userId, profiles.id))
      .where(and(...conditions, ...(search ? [ilike(profiles.fullName, `%${search}%`)] : [])));

    return ok(members, buildMeta(Number(totalRes.count), page, limit));
  } catch (err) {
    return handleError(err);
  }
}
