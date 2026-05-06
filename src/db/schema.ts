import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { Address, CustomerSnapshot, NotificationPrefs } from "@/types/domain";

export const orgCategoryEnum = pgEnum("org_category", [
  "saree",
  "dress",
  "kariyana",
  "jewellery",
  "electronics",
  "hardware",
  "general",
]);

export const orgRoleEnum = pgEnum("org_role", [
  "org_owner",
  "partner",
  "admin",
  "employee",
]);

export const shopRoleEnum = pgEnum("shop_role", ["admin", "employee"]);
export const memberStatusEnum = pgEnum("member_status", ["active", "suspended"]);
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "draft",
  "pending",
  "partial",
  "received",
  "cancelled",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "upi",
  "card",
  "credit",
  "cheque",
]);
export const skuStatusEnum = pgEnum("sku_status", [
  "available",
  "sold",
  "returned_supplier",
  "damaged",
]);
export const saleStatusEnum = pgEnum("sale_status", [
  "completed",
  "partial_return",
  "fully_returned",
]);
export const returnTypeEnum = pgEnum("return_type", [
  "customer_return",
  "supplier_return",
]);
export const returnStatusEnum = pgEnum("return_status", ["pending", "processed"]);
export const expenseCategoryEnum = pgEnum("expense_category", [
  "salary",
  "rent",
  "electricity",
  "transport",
  "maintenance",
  "misc",
  "other",
]);
export const payrollStatusEnum = pgEnum("payroll_status", ["pending", "paid"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "sale",
  "low_stock",
  "invite",
  "payment",
  "system",
]);
export const subscriptionIntervalEnum = pgEnum("subscription_interval", [
  "month",
  "year",
]);

const createdAt = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull();

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
    notificationPrefs: jsonb("notification_prefs")
      .$type<NotificationPrefs>()
      .default({})
      .notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    phoneIdx: index("idx_profiles_phone").on(table.phone),
  })
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    category: orgCategoryEnum("category").notNull(),
    logoUrl: text("logo_url"),
    address: jsonb("address").$type<Address>(),
    phone: text("phone"),
    email: text("email"),
    gstNumber: text("gst_number"),
    panNumber: text("pan_number"),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt,
    updatedAt,
  },
  (table) => ({
    slugIdx: uniqueIndex("idx_organizations_slug").on(table.slug),
    createdAtIdx: index("idx_organizations_created_at").on(table.createdAt),
  })
);

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    address: jsonb("address").$type<Address>(),
    phone: text("phone"),
    email: text("email"),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt,
    updatedAt,
  },
  (table) => ({
    orgIdx: index("idx_shops_org_id").on(table.orgId),
    orgCreatedAtIdx: index("idx_shops_org_created_at").on(
      table.orgId,
      table.createdAt
    ),
    orgCodeUnique: unique("shops_org_code_unique").on(table.orgId, table.code),
  })
);

export const orgMembers = pgTable(
  "org_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    role: orgRoleEnum("role").notNull(),
    status: memberStatusEnum("status").default("active").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    invitedBy: uuid("invited_by").references(() => profiles.id),
  },
  (table) => ({
    orgUserIdx: uniqueIndex("idx_org_members_org_user").on(
      table.orgId,
      table.userId
    ),
  })
);

export const shopMembers = pgTable(
  "shop_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    role: shopRoleEnum("role").notNull(),
    salary: integer("salary").default(0).notNull(),
    status: memberStatusEnum("status").default("active").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    shopUserIdx: uniqueIndex("idx_shop_members_shop_user").on(
      table.shopId,
      table.userId
    ),
  })
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
    invitedEmail: text("invited_email").notNull(),
    role: text("role").notNull(),
    token: text("token").notNull(),
    invitedBy: uuid("invited_by").references(() => profiles.id),
    status: inviteStatusEnum("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (table) => ({
    tokenIdx: uniqueIndex("idx_invites_token").on(table.token),
    orgStatusIdx: index("idx_invites_org_status").on(table.orgId, table.status),
  })
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    gstNumber: text("gst_number"),
    balance: integer("balance").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    orgShopIdx: index("idx_suppliers_org_shop").on(table.orgId, table.shopId),
  })
);

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    orderNumber: text("order_number").notNull(),
    status: purchaseOrderStatusEnum("status").default("draft").notNull(),
    subtotal: integer("subtotal").default(0).notNull(),
    discountAmount: integer("discount_amount").default(0).notNull(),
    gstAmount: integer("gst_amount").default(0).notNull(),
    totalAmount: integer("total_amount").default(0).notNull(),
    paidAmount: integer("paid_amount").default(0).notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    invoiceNumber: text("invoice_number"),
    invoiceDate: date("invoice_date"),
    notes: text("notes"),
    attachmentUrl: text("attachment_url"),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt,
    updatedAt,
  },
  (table) => ({
    orderNumberIdx: uniqueIndex("idx_purchase_orders_order_number").on(
      table.orderNumber
    ),
    shopStatusIdx: index("idx_purchase_orders_shop_status").on(
      table.shopId,
      table.status
    ),
  })
);

export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purchaseOrderId: uuid("purchase_order_id")
      .references(() => purchaseOrders.id, { onDelete: "cascade" })
      .notNull(),
    category: text("category"),
    subCategory: text("sub_category"),
    color: text("color"),
    size: text("size"),
    description: text("description"),
    qtyOrdered: integer("qty_ordered").default(0).notNull(),
    qtyReceived: integer("qty_received").default(0).notNull(),
    costPrice: integer("cost_price").default(0).notNull(),
    sellingPrice: integer("selling_price").default(0).notNull(),
    mrp: integer("mrp").default(0).notNull(),
    gstPercent: numeric("gst_percent", { precision: 5, scale: 2 })
      .default("0")
      .notNull(),
    totalCost: integer("total_cost").default(0).notNull(),
  },
  (table) => ({
    purchaseOrderIdx: index("idx_purchase_order_items_purchase_order_id").on(
      table.purchaseOrderId
    ),
  })
);

export const skus = pgTable(
  "skus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
    purchaseOrderItemId: uuid("purchase_order_item_id").references(
      () => purchaseOrderItems.id
    ),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    skuCode: text("sku_code").notNull(),
    qrData: text("qr_data").notNull(),
    qrImageUrl: text("qr_image_url"),
    category: text("category"),
    subCategory: text("sub_category"),
    color: text("color"),
    size: text("size"),
    description: text("description"),
    costPrice: integer("cost_price").default(0).notNull(),
    sellingPrice: integer("selling_price").default(0).notNull(),
    mrp: integer("mrp").default(0).notNull(),
    gstPercent: numeric("gst_percent", { precision: 5, scale: 2 })
      .default("0")
      .notNull(),
    status: skuStatusEnum("status").default("available").notNull(),
    soldAt: timestamp("sold_at", { withTimezone: true }),
    soldSaleId: uuid("sold_sale_id"),
    createdAt,
  },
  (table) => ({
    shopStatusIdx: index("idx_skus_shop_status").on(table.shopId, table.status),
    shopCategoryIdx: index("idx_skus_shop_category").on(
      table.shopId,
      table.category,
      table.subCategory
    ),
    qrDataIdx: index("idx_skus_qr_data").on(table.qrData),
    shopSkuUnique: unique("skus_shop_sku_code_unique").on(table.shopId, table.skuCode),
  })
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    whatsapp: text("whatsapp"),
    address: jsonb("address").$type<Address>(),
    notes: text("notes"),
    totalPurchases: integer("total_purchases").default(0).notNull(),
    totalSpend: integer("total_spend").default(0).notNull(),
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => ({
    shopPhoneIdx: index("idx_customers_shop_phone").on(table.shopId, table.phone),
  })
);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    billNumber: text("bill_number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id),
    customerSnapshot: jsonb("customer_snapshot").$type<CustomerSnapshot>(),
    subtotal: integer("subtotal").default(0).notNull(),
    discountTotal: integer("discount_total").default(0).notNull(),
    gstTotal: integer("gst_total").default(0).notNull(),
    grandTotal: integer("grand_total").default(0).notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    amountPaid: integer("amount_paid").default(0).notNull(),
    changeReturned: integer("change_returned").default(0).notNull(),
    status: saleStatusEnum("status").default("completed").notNull(),
    billSentWhatsapp: boolean("bill_sent_whatsapp").default(false).notNull(),
    billSentEmail: boolean("bill_sent_email").default(false).notNull(),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt,
  },
  (table) => ({
    shopCreatedAtIdx: index("idx_sales_shop_created_at").on(
      table.shopId,
      table.createdAt
    ),
    shopBillUnique: unique("sales_shop_bill_number_unique").on(
      table.shopId,
      table.billNumber
    ),
  })
);

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    saleId: uuid("sale_id")
      .references(() => sales.id, { onDelete: "cascade" })
      .notNull(),
    skuId: uuid("sku_id").references(() => skus.id),
    skuCode: text("sku_code"),
    category: text("category"),
    subCategory: text("sub_category"),
    color: text("color"),
    size: text("size"),
    mrp: integer("mrp").default(0).notNull(),
    sellingPrice: integer("selling_price").default(0).notNull(),
    discountAmount: integer("discount_amount").default(0).notNull(),
    gstPercent: numeric("gst_percent", { precision: 5, scale: 2 })
      .default("0")
      .notNull(),
    gstAmount: integer("gst_amount").default(0).notNull(),
    quantity: integer("quantity").default(1).notNull(),
  },
  (table) => ({
    saleIdIdx: index("idx_sale_items_sale_id").on(table.saleId),
  })
);

export const returns = pgTable(
  "returns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    type: returnTypeEnum("type").notNull(),
    referenceId: uuid("reference_id"),
    totalRefund: integer("total_refund").default(0).notNull(),
    refundMethod: text("refund_method"),
    status: returnStatusEnum("status").default("pending").notNull(),
    notes: text("notes"),
    processedBy: uuid("processed_by").references(() => profiles.id),
    createdAt,
  },
  (table) => ({
    shopStatusIdx: index("idx_returns_shop_status").on(table.shopId, table.status),
  })
);

export const returnItems = pgTable(
  "return_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    returnId: uuid("return_id")
      .references(() => returns.id, { onDelete: "cascade" })
      .notNull(),
    skuId: uuid("sku_id").references(() => skus.id),
    skuCode: text("sku_code"),
    reason: text("reason"),
    refundAmount: integer("refund_amount").default(0).notNull(),
  },
  (table) => ({
    returnIdIdx: index("idx_return_items_return_id").on(table.returnId),
  })
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    category: expenseCategoryEnum("category"),
    description: text("description"),
    amount: integer("amount").default(0).notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    paidTo: text("paid_to"),
    receiptUrl: text("receipt_url"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt,
  },
  (table) => ({
    shopDateIdx: index("idx_expenses_shop_date").on(table.shopId, table.date),
  })
);

export const payroll = pgTable(
  "payroll",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    month: text("month").notNull(),
    salary: integer("salary").default(0).notNull(),
    bonus: integer("bonus").default(0).notNull(),
    deduction: integer("deduction").default(0).notNull(),
    netPay: integer("net_pay").default(0).notNull(),
    status: payrollStatusEnum("status").default("pending").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidBy: uuid("paid_by").references(() => profiles.id),
    notes: text("notes"),
    createdAt,
  },
  (table) => ({
    shopMonthIdx: index("idx_payroll_shop_month").on(table.shopId, table.month),
  })
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    checkIn: timestamp("check_in", { withTimezone: true }),
    checkOut: timestamp("check_out", { withTimezone: true }),
  },
  (table) => ({
    shopDateIdx: index("idx_attendance_shop_date").on(table.shopId, table.date),
    uniquePresence: unique("attendance_shop_user_date_unique").on(
      table.shopId,
      table.userId,
      table.date
    ),
  })
);

export const dailyKharsa = pgTable(
  "daily_kharsa",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    openingBalance: integer("opening_balance").default(0).notNull(),
    totalSales: integer("total_sales").default(0).notNull(),
    totalReturns: integer("total_returns").default(0).notNull(),
    totalPurchases: integer("total_purchases").default(0).notNull(),
    totalExpenses: integer("total_expenses").default(0).notNull(),
    cashInHand: integer("cash_in_hand").default(0).notNull(),
    closingBalance: integer("closing_balance").default(0).notNull(),
    salesCount: integer("sales_count").default(0).notNull(),
    isClosed: boolean("is_closed").default(false).notNull(),
    closedBy: uuid("closed_by").references(() => profiles.id),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt,
  },
  (table) => ({
    shopDateIdx: index("idx_daily_kharsa_shop_date").on(table.shopId, table.date),
    uniqueShopDate: unique("daily_kharsa_shop_date_unique").on(
      table.shopId,
      table.date
    ),
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    actionUrl: text("action_url"),
    createdAt,
  },
  (table) => ({
    userReadIdx: index("idx_notifications_user_read").on(
      table.userId,
      table.isRead
    ),
  })
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    planName: text("plan_name"),
    interval: subscriptionIntervalEnum("interval"),
    status: text("status"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    trialEnd: timestamp("trial_end", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => ({
    orgUnique: uniqueIndex("idx_subscriptions_org_id").on(table.orgId),
    customerUnique: uniqueIndex("idx_subscriptions_customer_id").on(
      table.stripeCustomerId
    ),
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: uuid("entity_id"),
    changes: jsonb("changes").$type<Record<string, unknown>>(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt,
  },
  (table) => ({
    orgShopCreatedIdx: index("idx_audit_logs_org_shop_created_at").on(
      table.orgId,
      table.shopId,
      table.createdAt
    ),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
