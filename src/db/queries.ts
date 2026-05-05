import { and, count, desc, eq, ilike, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  auditLogs,
  orgMembers,
  organizations,
  shops,
  subscriptions,
} from "@/db/schema";
import { getPaginationState, buildPaginationMeta } from "@/lib/pagination";
import { slugify } from "@/lib/utils";
import type { ListQueryParams } from "@/types/api";
import type { OrgCategory } from "@/types/domain";

export interface OrganizationListInput extends ListQueryParams {
  category?: OrgCategory;
}

export async function listOrganizations(input: OrganizationListInput) {
  const { page, limit, offset } = getPaginationState(input);
  const filters = [
    input.search ? ilike(organizations.name, `%${input.search}%`) : undefined,
    input.category ? eq(organizations.category, input.category) : undefined,
  ].filter(Boolean);

  const whereClause =
    filters.length > 0 ? and(...filters) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        category: organizations.category,
        phone: organizations.phone,
        email: organizations.email,
        createdAt: organizations.createdAt,
        shopCount: sql<number>`count(${shops.id})`,
        activePlan: subscriptions.planName,
      })
      .from(organizations)
      .leftJoin(shops, eq(shops.orgId, organizations.id))
      .leftJoin(subscriptions, eq(subscriptions.orgId, organizations.id))
      .where(whereClause)
      .groupBy(organizations.id, subscriptions.planName)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(organizations)
      .where(whereClause),
  ]);

  return {
    rows,
    meta: buildPaginationMeta(totalRow[0]?.value ?? 0, page, limit),
  };
}

export async function createOrganization(input: {
  name: string;
  category: OrgCategory;
  phone?: string;
  email?: string;
  createdBy?: string;
}) {
  const baseSlug = slugify(input.name);
  const slugSuffix = Math.random().toString(36).slice(2, 6);
  const slug = `${baseSlug}-${slugSuffix}`;

  const [organization] = await db
    .insert(organizations)
    .values({
      name: input.name,
      slug,
      category: input.category,
      phone: input.phone,
      email: input.email,
      createdBy: input.createdBy,
    })
    .returning();

  return organization;
}

export async function listShopsByOrg(orgId: string) {
  return db
    .select()
    .from(shops)
    .where(eq(shops.orgId, orgId))
    .orderBy(desc(shops.createdAt));
}

export async function createShop(input: {
  orgId: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  createdBy?: string;
}) {
  const [shop] = await db
    .insert(shops)
    .values({
      orgId: input.orgId,
      name: input.name,
      code: input.code.toUpperCase(),
      phone: input.phone,
      email: input.email,
      createdBy: input.createdBy,
    })
    .returning();

  return shop;
}

export async function createOrganizationWithOwner(input: {
  userId: string;
  orgName: string;
  category: OrgCategory;
  shopName: string;
  shopCode: string;
  phone?: string;
  email?: string;
}) {
  return db.transaction(async (tx) => {
    const baseSlug = slugify(input.orgName);
    const slugSuffix = Math.random().toString(36).slice(2, 6);
    const slug = `${baseSlug}-${slugSuffix}`;

    const [organization] = await tx
      .insert(organizations)
      .values({
        name: input.orgName,
        slug,
        category: input.category,
        phone: input.phone,
        email: input.email,
        createdBy: input.userId,
      })
      .returning();

    const [shop] = await tx
      .insert(shops)
      .values({
        orgId: organization.id,
        name: input.shopName,
        code: input.shopCode.toUpperCase(),
        phone: input.phone,
        email: input.email,
        createdBy: input.userId,
      })
      .returning();

    await tx.insert(orgMembers).values({
      orgId: organization.id,
      userId: input.userId,
      role: "org_owner",
      status: "active",
      invitedBy: input.userId,
    });

    await tx.insert(auditLogs).values({
      orgId: organization.id,
      shopId: shop.id,
      userId: input.userId,
      action: "org.created",
      entity: "organization",
      entityId: organization.id,
      changes: {
        organization: organization.name,
        shop: shop.name,
      },
    });

    return {
      organization,
      shop,
    };
  });
}

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
