export type OrgCategory =
  | "saree"
  | "dress"
  | "kariyana"
  | "jewellery"
  | "electronics"
  | "hardware"
  | "general";

export type OrgRole = "org_owner" | "partner" | "admin" | "employee";
export type ShopRole = "admin" | "employee";
export type MemberStatus = "active" | "suspended";
export type InviteStatus = "pending" | "accepted" | "expired" | "cancelled";
export type PurchaseOrderStatus =
  | "draft"
  | "pending"
  | "partial"
  | "received"
  | "cancelled";
export type PaymentMethod =
  | "cash"
  | "upi"
  | "card"
  | "credit"
  | "cheque";
export type SkuStatus =
  | "available"
  | "sold"
  | "returned_supplier"
  | "damaged";
export type SaleStatus = "completed" | "partial_return" | "fully_returned";
export type ReturnType = "customer_return" | "supplier_return";
export type ReturnStatus = "pending" | "processed";
export type ExpenseCategory =
  | "salary"
  | "rent"
  | "electricity"
  | "transport"
  | "maintenance"
  | "misc"
  | "other";
export type PayrollStatus = "pending" | "paid";
export type NotificationType =
  | "sale"
  | "low_stock"
  | "invite"
  | "payment"
  | "system";
export type SubscriptionInterval = "month" | "year";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "unpaid";
export type PlanName = "Free" | "Basic" | "Pro";

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface CustomerSnapshot {
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface NotificationPrefs {
  email_sales?: boolean;
  email_summary?: boolean;
  app_sale?: boolean;
  app_stock?: boolean;
}

export interface StripePlanPrice {
  priceId: string;
  amount: number;
  currency: string;
  interval: SubscriptionInterval;
}

export interface StripePlan {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  prices: Partial<Record<SubscriptionInterval, StripePlanPrice>>;
}

