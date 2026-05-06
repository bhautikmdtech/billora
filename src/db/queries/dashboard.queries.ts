import { and, count, desc, eq, ilike, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  organizations,
  shops,
} from "@/db/schema";

export async function getDashboardOverview() {
  const [orgCountRow, shopCountRow, recentOrgs, categoryMix] = await Promise.all([
    db.select({ value: count() }).from(organizations),
    db.select({ value: count() }).from(shops),
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        category: organizations.category,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(5),
    db
      .select({
        category: organizations.category,
        count: count(),
      })
      .from(organizations)
      .groupBy(organizations.category)
      .orderBy(desc(count())),
  ]);

  return {
    stats: {
      organizations: orgCountRow[0]?.value ?? 0,
      shops: shopCountRow[0]?.value ?? 0,
      activeCategories: categoryMix.length,
    },
    recentOrganizations: recentOrgs,
    categoryMix,
  };
}
