-- ================================================================
-- BILLORA ERP — COMPLETE FRESH MIGRATION v1.0
-- Run once in Supabase SQL Editor
-- Database is empty — no alter needed, all CREATE TABLE fresh
-- ================================================================

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ================================================================
-- ENUMS
-- ================================================================

create type org_category as enum (
  'saree','dress','kariyana','jewellery',
  'electronics','hardware','footwear',
  'pharmacy','stationery','general'
);

create type org_role as enum (
  'org_owner','partner','admin','employee'
);

create type shop_role as enum (
  'admin','employee'
);

create type member_status as enum (
  'active','suspended'
);

create type invite_status as enum (
  'pending','accepted','expired','cancelled'
);

create type purchase_order_status as enum (
  'draft','pending','partial','received','cancelled'
);

create type payment_method as enum (
  'cash','upi','card','credit','cheque'
);

create type sku_status as enum (
  'available','sold','returned_supplier','damaged','reserved'
);

create type sale_status as enum (
  'completed','partial_return','fully_returned'
);

create type return_type as enum (
  'customer_return','supplier_return'
);

create type return_status as enum (
  'pending','processed','rejected'
);

create type expense_category as enum (
  'salary','rent','electricity','transport',
  'maintenance','misc','purchase','other'
);

create type payroll_status as enum (
  'pending','paid','cancelled'
);

create type attendance_status as enum (
  'present','absent','half','leave'
);

create type notification_type as enum (
  'sale','low_stock','invite','payment','system','return','expense'
);

create type subscription_interval as enum (
  'month','year'
);

create type subscription_status as enum (
  'active','trialing','past_due','cancelled','unpaid','paused'
);

create type advance_status as enum (
  'pending','deducted','cancelled'
);

create type audit_severity as enum (
  'info','warn','error'
);

-- ================================================================
-- TABLE: profiles
-- Extends Supabase auth.users
-- ================================================================

create table public.profiles (
  id                  uuid          primary key references auth.users(id) on delete cascade,
  full_name           text          not null,
  phone               text,
  avatar_url          text,
  is_superadmin       boolean       not null default false,
  is_active           boolean       not null default true,
  timezone            text          not null default 'Asia/Kolkata',
  language            text          not null default 'en',
  notification_prefs  jsonb         not null default '{
    "email_sales": false,
    "email_daily_summary": true,
    "email_invite": true,
    "email_payment": true,
    "app_sale": true,
    "app_low_stock": true,
    "app_invite": true,
    "app_payment": true
  }'::jsonb,
  last_login_at       timestamptz,
  created_at          timestamptz   not null default timezone('utc', now()),
  updated_at          timestamptz   not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: organizations
-- Top-level business entity
-- ================================================================

create table public.organizations (
  id              uuid          primary key default gen_random_uuid(),
  name            text          not null,
  slug            text          not null unique,
  category        org_category  not null,
  logo_url        text,
  address         jsonb,
  phone           text,
  email           text,
  gst_number      text,
  pan_number      text,
  website         text,
  currency        text          not null default 'INR',
  tax_label       text          not null default 'GST',
  bill_prefix     text,
  shop_count      integer       not null default 0,
  member_count    integer       not null default 0,
  is_active       boolean       not null default true,
  created_by      uuid          references public.profiles(id) on delete set null,
  created_at      timestamptz   not null default timezone('utc', now()),
  updated_at      timestamptz   not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: shops
-- Branches / locations under an organization
-- ================================================================

create table public.shops (
  id              uuid          primary key default gen_random_uuid(),
  org_id          uuid          not null references public.organizations(id) on delete cascade,
  name            text          not null,
  code            text          not null,
  address         jsonb,
  phone           text,
  email           text,
  logo_url        text,
  gst_number      text,
  bill_counter    integer       not null default 0,
  sku_counter     integer       not null default 0,
  po_counter      integer       not null default 0,
  is_active       boolean       not null default true,
  is_default      boolean       not null default false,
  timezone        text          not null default 'Asia/Kolkata',
  created_by      uuid          references public.profiles(id) on delete set null,
  created_at      timestamptz   not null default timezone('utc', now()),
  updated_at      timestamptz   not null default timezone('utc', now()),
  unique (org_id, code)
);

-- ================================================================
-- TABLE: org_members
-- Org-level roles: org_owner, partner, admin, employee
-- ================================================================

create table public.org_members (
  id          uuid          primary key default gen_random_uuid(),
  org_id      uuid          not null references public.organizations(id) on delete cascade,
  user_id     uuid          not null references public.profiles(id) on delete cascade,
  role        org_role      not null,
  status      member_status not null default 'active',
  note        text,
  invited_by  uuid          references public.profiles(id) on delete set null,
  joined_at   timestamptz   not null default timezone('utc', now()),
  unique (org_id, user_id)
);

-- ================================================================
-- TABLE: shop_members
-- Shop-level roles: admin, employee
-- org_owner and partner access all shops via org_members
-- ================================================================

create table public.shop_members (
  id          uuid          primary key default gen_random_uuid(),
  shop_id     uuid          not null references public.shops(id) on delete cascade,
  org_id      uuid          not null references public.organizations(id) on delete cascade,
  user_id     uuid          not null references public.profiles(id) on delete cascade,
  role        shop_role     not null,
  salary      integer       not null default 0,
  status      member_status not null default 'active',
  note        text,
  invited_by  uuid          references public.profiles(id) on delete set null,
  joined_at   timestamptz   not null default timezone('utc', now()),
  unique (shop_id, user_id)
);

-- ================================================================
-- TABLE: invites
-- Pending invitations to join org or shop
-- ================================================================

create table public.invites (
  id              uuid          primary key default gen_random_uuid(),
  org_id          uuid          not null references public.organizations(id) on delete cascade,
  shop_id         uuid          references public.shops(id) on delete cascade,
  invited_email   text          not null,
  role            text          not null,
  token           text          not null unique,
  message         text,
  invited_by      uuid          references public.profiles(id) on delete set null,
  accepted_by     uuid          references public.profiles(id) on delete set null,
  status          invite_status not null default 'pending',
  expires_at      timestamptz   not null,
  accepted_at     timestamptz,
  created_at      timestamptz   not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: shop_settings
-- Per-shop configuration
-- ================================================================

create table public.shop_settings (
  id                    uuid        primary key default gen_random_uuid(),
  shop_id               uuid        not null unique references public.shops(id) on delete cascade,
  org_id                uuid        not null references public.organizations(id) on delete cascade,
  bill_footer           text        not null default 'Thank you for shopping with us!',
  bill_show_gst         boolean     not null default true,
  bill_show_mrp         boolean     not null default true,
  bill_show_logo        boolean     not null default true,
  bill_show_qr          boolean     not null default true,
  low_stock_threshold   integer     not null default 5,
  allow_credit          boolean     not null default true,
  require_customer      boolean     not null default false,
  auto_kharsa           boolean     not null default true,
  whatsapp_number       text,
  upi_id                text,
  created_at            timestamptz not null default timezone('utc', now()),
  updated_at            timestamptz not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: product_categories
-- Custom categories per org (hierarchical)
-- ================================================================

create table public.product_categories (
  id          uuid        primary key default gen_random_uuid(),
  org_id      uuid        not null references public.organizations(id) on delete cascade,
  name        text        not null,
  parent_id   uuid        references public.product_categories(id) on delete cascade,
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default timezone('utc', now()),
  unique (org_id, name, parent_id)
);

-- ================================================================
-- TABLE: suppliers
-- ================================================================

create table public.suppliers (
  id              uuid        primary key default gen_random_uuid(),
  org_id          uuid        not null references public.organizations(id) on delete cascade,
  shop_id         uuid        references public.shops(id) on delete cascade,
  name            text        not null,
  phone           text,
  email           text,
  address         text,
  gst_number      text,
  pan_number      text,
  bank_name       text,
  bank_account    text,
  bank_ifsc       text,
  balance         integer     not null default 0,
  total_orders    integer     not null default 0,
  total_amount    integer     not null default 0,
  notes           text,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: purchase_orders
-- Stock purchase from supplier
-- ================================================================

create table public.purchase_orders (
  id              uuid                    primary key default gen_random_uuid(),
  org_id          uuid                    not null references public.organizations(id) on delete cascade,
  shop_id         uuid                    not null references public.shops(id) on delete cascade,
  supplier_id     uuid                    references public.suppliers(id) on delete set null,
  order_number    text                    not null unique,
  status          purchase_order_status   not null default 'draft',
  subtotal        integer                 not null default 0,
  discount_amount integer                 not null default 0,
  gst_amount      integer                 not null default 0,
  total_amount    integer                 not null default 0,
  paid_amount     integer                 not null default 0,
  balance_due     integer                 not null default 0,
  payment_method  payment_method,
  invoice_number  text,
  invoice_date    date,
  notes           text,
  attachment_url  text,
  received_at     timestamptz,
  received_by     uuid                    references public.profiles(id) on delete set null,
  cancelled_at    timestamptz,
  cancelled_by    uuid                    references public.profiles(id) on delete set null,
  cancel_reason   text,
  created_by      uuid                    references public.profiles(id) on delete set null,
  created_at      timestamptz             not null default timezone('utc', now()),
  updated_at      timestamptz             not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: purchase_order_items
-- Line items inside a purchase order
-- ================================================================

create table public.purchase_order_items (
  id                  uuid        primary key default gen_random_uuid(),
  purchase_order_id   uuid        not null references public.purchase_orders(id) on delete cascade,
  category            text,
  sub_category        text,
  color               text,
  size                text,
  description         text,
  hsn                 text,
  unit                text        not null default 'piece',
  qty_ordered         integer     not null default 0,
  qty_received        integer     not null default 0,
  cost_price          integer     not null default 0,
  selling_price       integer     not null default 0,
  mrp                 integer     not null default 0,
  gst_percent         numeric(5,2) not null default 0,
  total_cost          integer     not null default 0
);

-- ================================================================
-- TABLE: skus
-- One row per physical unit of stock
-- ================================================================

create table public.skus (
  id                      uuid        primary key default gen_random_uuid(),
  org_id                  uuid        not null references public.organizations(id) on delete cascade,
  shop_id                 uuid        not null references public.shops(id) on delete cascade,
  purchase_order_id       uuid        references public.purchase_orders(id) on delete set null,
  purchase_order_item_id  uuid        references public.purchase_order_items(id) on delete set null,
  supplier_id             uuid        references public.suppliers(id) on delete set null,
  sku_code                text        not null,
  qr_data                 text        not null,
  qr_image_url            text,
  barcode                 text,
  category                text,
  sub_category            text,
  color                   text,
  size                    text,
  description             text,
  hsn                     text,
  unit                    text        not null default 'piece',
  weight                  numeric(8,2),
  cost_price              integer     not null default 0,
  selling_price           integer     not null default 0,
  mrp                     integer     not null default 0,
  gst_percent             numeric(5,2) not null default 0,
  min_stock_alert         integer     not null default 5,
  notes                   text,
  status                  sku_status  not null default 'available',
  sold_at                 timestamptz,
  sold_sale_id            uuid,
  returned_at             timestamptz,
  created_at              timestamptz not null default timezone('utc', now()),
  updated_at              timestamptz not null default timezone('utc', now()),
  unique (shop_id, sku_code)
);

-- ================================================================
-- TABLE: customers
-- ================================================================

create table public.customers (
  id                  uuid        primary key default gen_random_uuid(),
  org_id              uuid        not null references public.organizations(id) on delete cascade,
  shop_id             uuid        not null references public.shops(id) on delete cascade,
  name                text        not null,
  phone               text,
  email               text,
  whatsapp            text,
  address             jsonb,
  gstin               text,
  birthday            date,
  anniversary         date,
  tags                text[]      not null default '{}',
  notes               text,
  credit_limit        integer     not null default 0,
  outstanding_balance integer     not null default 0,
  total_purchases     integer     not null default 0,
  total_spend         integer     not null default 0,
  last_visit_at       timestamptz,
  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: sales
-- ================================================================

create table public.sales (
  id                  uuid          primary key default gen_random_uuid(),
  org_id              uuid          not null references public.organizations(id) on delete cascade,
  shop_id             uuid          not null references public.shops(id) on delete cascade,
  bill_number         text          not null,
  customer_id         uuid          references public.customers(id) on delete set null,
  customer_snapshot   jsonb,
  subtotal            integer       not null default 0,
  discount_total      integer       not null default 0,
  gst_total           integer       not null default 0,
  grand_total         integer       not null default 0,
  payment_method      payment_method,
  amount_paid         integer       not null default 0,
  change_returned     integer       not null default 0,
  status              sale_status   not null default 'completed',
  notes               text,
  discount_reason     text,
  reference_no        text,
  bill_sent_whatsapp  boolean       not null default false,
  bill_sent_email     boolean       not null default false,
  created_by          uuid          references public.profiles(id) on delete set null,
  created_at          timestamptz   not null default timezone('utc', now()),
  unique (shop_id, bill_number)
);

-- ================================================================
-- TABLE: sale_items
-- ================================================================

create table public.sale_items (
  id              uuid        primary key default gen_random_uuid(),
  sale_id         uuid        not null references public.sales(id) on delete cascade,
  sku_id          uuid        references public.skus(id) on delete set null,
  sku_code        text,
  category        text,
  sub_category    text,
  color           text,
  size            text,
  description     text,
  hsn             text,
  mrp             integer     not null default 0,
  selling_price   integer     not null default 0,
  discount_amount integer     not null default 0,
  gst_percent     numeric(5,2) not null default 0,
  gst_amount      integer     not null default 0,
  quantity        integer     not null default 1
);

-- ================================================================
-- TABLE: returns
-- Customer returns and supplier returns
-- ================================================================

create table public.returns (
  id              uuid          primary key default gen_random_uuid(),
  org_id          uuid          not null references public.organizations(id) on delete cascade,
  shop_id         uuid          not null references public.shops(id) on delete cascade,
  type            return_type   not null,
  reference_id    uuid,
  reference_type  text,
  total_refund    integer       not null default 0,
  refund_method   text,
  status          return_status not null default 'pending',
  notes           text,
  approved_by     uuid          references public.profiles(id) on delete set null,
  approved_at     timestamptz,
  processed_by    uuid          references public.profiles(id) on delete set null,
  processed_at    timestamptz,
  created_by      uuid          references public.profiles(id) on delete set null,
  created_at      timestamptz   not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: return_items
-- ================================================================

create table public.return_items (
  id              uuid        primary key default gen_random_uuid(),
  return_id       uuid        not null references public.returns(id) on delete cascade,
  sku_id          uuid        references public.skus(id) on delete set null,
  sku_code        text,
  reason          text,
  refund_amount   integer     not null default 0
);

-- ================================================================
-- TABLE: expenses
-- Daily expenses / kharsa entries
-- ================================================================

create table public.expenses (
  id              uuid                primary key default gen_random_uuid(),
  org_id          uuid                not null references public.organizations(id) on delete cascade,
  shop_id         uuid                not null references public.shops(id) on delete cascade,
  date            date                not null,
  category        expense_category,
  description     text,
  amount          integer             not null default 0,
  payment_method  payment_method,
  paid_to         text,
  receipt_url     text,
  is_recurring    boolean             not null default false,
  tags            text[]              not null default '{}',
  created_by      uuid                references public.profiles(id) on delete set null,
  created_at      timestamptz         not null default timezone('utc', now()),
  updated_at      timestamptz         not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: payroll
-- Monthly staff payroll
-- ================================================================

create table public.payroll (
  id              uuid            primary key default gen_random_uuid(),
  org_id          uuid            not null references public.organizations(id) on delete cascade,
  shop_id         uuid            not null references public.shops(id) on delete cascade,
  user_id         uuid            not null references public.profiles(id) on delete cascade,
  month           text            not null,
  salary          integer         not null default 0,
  bonus           integer         not null default 0,
  deduction       integer         not null default 0,
  advance_paid    integer         not null default 0,
  net_pay         integer         not null default 0,
  attendance_days integer         not null default 0,
  working_days    integer         not null default 0,
  status          payroll_status  not null default 'pending',
  paid_at         timestamptz,
  paid_by         uuid            references public.profiles(id) on delete set null,
  notes           text,
  created_at      timestamptz     not null default timezone('utc', now()),
  unique (shop_id, user_id, month)
);

-- ================================================================
-- TABLE: staff_advances
-- Salary advances given to staff
-- ================================================================

create table public.staff_advances (
  id          uuid            primary key default gen_random_uuid(),
  org_id      uuid            not null references public.organizations(id) on delete cascade,
  shop_id     uuid            not null references public.shops(id) on delete cascade,
  user_id     uuid            not null references public.profiles(id) on delete cascade,
  amount      integer         not null,
  reason      text,
  status      advance_status  not null default 'pending',
  paid_at     date            not null,
  paid_by     uuid            references public.profiles(id) on delete set null,
  payroll_id  uuid            references public.payroll(id) on delete set null,
  created_at  timestamptz     not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: attendance
-- Daily staff attendance
-- ================================================================

create table public.attendance (
  id          uuid                primary key default gen_random_uuid(),
  org_id      uuid                not null references public.organizations(id) on delete cascade,
  shop_id     uuid                not null references public.shops(id) on delete cascade,
  user_id     uuid                not null references public.profiles(id) on delete cascade,
  date        date                not null,
  status      attendance_status   not null default 'present',
  check_in    timestamptz,
  check_out   timestamptz,
  note        text,
  approved_by uuid                references public.profiles(id) on delete set null,
  unique (shop_id, user_id, date)
);

-- ================================================================
-- TABLE: daily_kharsa
-- Daily ledger summary per shop
-- ================================================================

create table public.daily_kharsa (
  id                  uuid        primary key default gen_random_uuid(),
  org_id              uuid        not null references public.organizations(id) on delete cascade,
  shop_id             uuid        not null references public.shops(id) on delete cascade,
  date                date        not null,
  opening_balance     integer     not null default 0,
  total_sales         integer     not null default 0,
  total_cash_sales    integer     not null default 0,
  total_upi_sales     integer     not null default 0,
  total_card_sales    integer     not null default 0,
  total_credit_sales  integer     not null default 0,
  total_returns       integer     not null default 0,
  total_purchases     integer     not null default 0,
  total_expenses      integer     not null default 0,
  cash_in_hand        integer     not null default 0,
  closing_balance     integer     not null default 0,
  sales_count         integer     not null default 0,
  return_count        integer     not null default 0,
  expense_count       integer     not null default 0,
  is_closed           boolean     not null default false,
  closed_by           uuid        references public.profiles(id) on delete set null,
  closed_at           timestamptz,
  notes               text,
  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now()),
  unique (shop_id, date)
);

-- ================================================================
-- TABLE: notifications
-- ================================================================

create table public.notifications (
  id          uuid                primary key default gen_random_uuid(),
  user_id     uuid                not null references public.profiles(id) on delete cascade,
  org_id      uuid                references public.organizations(id) on delete cascade,
  shop_id     uuid                references public.shops(id) on delete cascade,
  type        notification_type,
  title       text                not null,
  message     text                not null,
  is_read     boolean             not null default false,
  action_url  text,
  metadata    jsonb,
  expires_at  timestamptz,
  created_at  timestamptz         not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: subscriptions
-- One per organization, Stripe-managed
-- ================================================================

create table public.subscriptions (
  id                      uuid                    primary key default gen_random_uuid(),
  org_id                  uuid                    not null unique references public.organizations(id) on delete cascade,
  stripe_customer_id      text                    unique,
  stripe_subscription_id  text,
  stripe_price_id         text,
  plan_name               text,
  interval                subscription_interval,
  status                  subscription_status     not null default 'trialing',
  max_shops               integer                 not null default 1,
  max_skus                integer                 not null default 500,
  can_export              boolean                 not null default false,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  trial_start             timestamptz,
  trial_end               timestamptz,
  cancel_at_period_end    boolean                 not null default false,
  created_at              timestamptz             not null default timezone('utc', now()),
  updated_at              timestamptz             not null default timezone('utc', now())
);

-- ================================================================
-- TABLE: audit_logs
-- Every important action logged here
-- ================================================================

create table public.audit_logs (
  id          uuid            primary key default gen_random_uuid(),
  org_id      uuid            references public.organizations(id) on delete cascade,
  shop_id     uuid            references public.shops(id) on delete cascade,
  user_id     uuid            references public.profiles(id) on delete set null,
  action      text            not null,
  entity      text,
  entity_id   uuid,
  changes     jsonb,
  severity    audit_severity  not null default 'info',
  ip          text,
  user_agent  text,
  created_at  timestamptz     not null default timezone('utc', now())
);

-- ================================================================
-- ALL INDEXES
-- ================================================================

-- profiles
create index idx_profiles_phone           on public.profiles(phone);
create index idx_profiles_superadmin      on public.profiles(is_superadmin) where is_superadmin = true;

-- organizations
create index idx_organizations_slug       on public.organizations(slug);
create index idx_organizations_created_at on public.organizations(created_at desc);
create index idx_organizations_active     on public.organizations(is_active);

-- shops
create index idx_shops_org_id             on public.shops(org_id);
create index idx_shops_org_active         on public.shops(org_id, is_active);
create index idx_shops_org_created_at     on public.shops(org_id, created_at desc);

-- org_members
create index idx_org_members_org_id       on public.org_members(org_id);
create index idx_org_members_user_id      on public.org_members(user_id);
create index idx_org_members_org_user     on public.org_members(org_id, user_id);
create index idx_org_members_role         on public.org_members(org_id, role);

-- shop_members
create index idx_shop_members_shop_id     on public.shop_members(shop_id);
create index idx_shop_members_user_id     on public.shop_members(user_id);
create index idx_shop_members_shop_user   on public.shop_members(shop_id, user_id);
create index idx_shop_members_org_user    on public.shop_members(org_id, user_id);

-- invites
create index idx_invites_token            on public.invites(token);
create index idx_invites_org_status       on public.invites(org_id, status);
create index idx_invites_email            on public.invites(invited_email);
create index idx_invites_expires          on public.invites(expires_at) where status = 'pending';

-- shop_settings
create index idx_shop_settings_shop_id    on public.shop_settings(shop_id);

-- product_categories
create index idx_product_categories_org   on public.product_categories(org_id);
create index idx_product_categories_parent on public.product_categories(org_id, parent_id);

-- suppliers
create index idx_suppliers_org_id         on public.suppliers(org_id);
create index idx_suppliers_org_shop       on public.suppliers(org_id, shop_id);
create index idx_suppliers_active         on public.suppliers(org_id, is_active);

-- purchase_orders
create index idx_po_shop_status           on public.purchase_orders(shop_id, status);
create index idx_po_shop_created          on public.purchase_orders(shop_id, created_at desc);
create index idx_po_supplier              on public.purchase_orders(supplier_id);
create index idx_po_order_number          on public.purchase_orders(order_number);

-- purchase_order_items
create index idx_poi_purchase_order       on public.purchase_order_items(purchase_order_id);

-- skus
create index idx_skus_shop_status         on public.skus(shop_id, status);
create index idx_skus_shop_category       on public.skus(shop_id, category, sub_category);
create index idx_skus_shop_color          on public.skus(shop_id, color);
create index idx_skus_qr_data             on public.skus(qr_data);
create index idx_skus_sku_code            on public.skus(shop_id, sku_code);
create index idx_skus_supplier            on public.skus(supplier_id);
create index idx_skus_purchase_order      on public.skus(purchase_order_id);
create index idx_skus_created             on public.skus(shop_id, created_at desc);

-- customers
create index idx_customers_shop_phone     on public.customers(shop_id, phone);
create index idx_customers_shop_name      on public.customers(shop_id, name);
create index idx_customers_org_id         on public.customers(org_id);

-- sales
create index idx_sales_shop_created       on public.sales(shop_id, created_at desc);
create index idx_sales_shop_status        on public.sales(shop_id, status);
create index idx_sales_customer           on public.sales(customer_id);
create index idx_sales_created_by         on public.sales(created_by);
create index idx_sales_bill_number        on public.sales(shop_id, bill_number);
create index idx_sales_payment_method     on public.sales(shop_id, payment_method);

-- sale_items
create index idx_sale_items_sale_id       on public.sale_items(sale_id);
create index idx_sale_items_sku_id        on public.sale_items(sku_id);

-- returns
create index idx_returns_shop_status      on public.returns(shop_id, status);
create index idx_returns_shop_created     on public.returns(shop_id, created_at desc);
create index idx_returns_reference        on public.returns(reference_id);

-- return_items
create index idx_return_items_return_id   on public.return_items(return_id);
create index idx_return_items_sku_id      on public.return_items(sku_id);

-- expenses
create index idx_expenses_shop_date       on public.expenses(shop_id, date desc);
create index idx_expenses_shop_category   on public.expenses(shop_id, category);
create index idx_expenses_org_date        on public.expenses(org_id, date desc);

-- payroll
create index idx_payroll_shop_month       on public.payroll(shop_id, month);
create index idx_payroll_user_month       on public.payroll(user_id, month);

-- staff_advances
create index idx_advances_shop_user       on public.staff_advances(shop_id, user_id);
create index idx_advances_payroll         on public.staff_advances(payroll_id);

-- attendance
create index idx_attendance_shop_date     on public.attendance(shop_id, date desc);
create index idx_attendance_user_date     on public.attendance(user_id, date desc);
create index idx_attendance_shop_user     on public.attendance(shop_id, user_id);

-- daily_kharsa
create index idx_kharsa_shop_date         on public.daily_kharsa(shop_id, date desc);
create index idx_kharsa_open              on public.daily_kharsa(shop_id, is_closed);

-- notifications
create index idx_notifications_user_read  on public.notifications(user_id, is_read);
create index idx_notifications_user_date  on public.notifications(user_id, created_at desc);
create index idx_notifications_expires    on public.notifications(expires_at) where expires_at is not null;

-- subscriptions
create index idx_subscriptions_org        on public.subscriptions(org_id);
create index idx_subscriptions_stripe_cus on public.subscriptions(stripe_customer_id);
create index idx_subscriptions_status     on public.subscriptions(status);

-- audit_logs
create index idx_audit_org_created        on public.audit_logs(org_id, created_at desc);
create index idx_audit_shop_created       on public.audit_logs(shop_id, created_at desc);
create index idx_audit_user               on public.audit_logs(user_id, created_at desc);
create index idx_audit_entity             on public.audit_logs(entity, entity_id);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Auto-update updated_at on any table
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Auto-create profile when user signs up in Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Increment shop bill counter atomically, return next number
create or replace function public.next_bill_counter(p_shop_id uuid)
returns integer as $$
declare
  v_counter integer;
begin
  update public.shops
  set bill_counter = bill_counter + 1
  where id = p_shop_id
  returning bill_counter into v_counter;
  return v_counter;
end;
$$ language plpgsql security definer;

-- Increment shop SKU counter atomically
create or replace function public.next_sku_counter(p_shop_id uuid)
returns integer as $$
declare
  v_counter integer;
begin
  update public.shops
  set sku_counter = sku_counter + 1
  where id = p_shop_id
  returning sku_counter into v_counter;
  return v_counter;
end;
$$ language plpgsql security definer;

-- Increment PO counter atomically
create or replace function public.next_po_counter(p_shop_id uuid)
returns integer as $$
declare
  v_counter integer;
begin
  update public.shops
  set po_counter = po_counter + 1
  where id = p_shop_id
  returning po_counter into v_counter;
  return v_counter;
end;
$$ language plpgsql security definer;

-- Get user role in org
create or replace function public.get_user_org_role(p_user_id uuid, p_org_id uuid)
returns text as $$
  select role::text from public.org_members
  where user_id = p_user_id and org_id = p_org_id and status = 'active'
  limit 1;
$$ language sql security definer stable;

-- Get user role in shop
create or replace function public.get_user_shop_role(p_user_id uuid, p_shop_id uuid)
returns text as $$
  select role::text from public.shop_members
  where user_id = p_user_id and shop_id = p_shop_id and status = 'active'
  limit 1;
$$ language sql security definer stable;

-- Check if user can access shop
-- (org_owner/partner can access all shops in their org)
create or replace function public.user_can_access_shop(p_user_id uuid, p_shop_id uuid)
returns boolean as $$
declare
  v_org_id uuid;
  v_org_role text;
  v_shop_role text;
begin
  select org_id into v_org_id from public.shops where id = p_shop_id;
  if v_org_id is null then return false; end if;
  v_org_role := public.get_user_org_role(p_user_id, v_org_id);
  if v_org_role in ('org_owner', 'partner') then return true; end if;
  v_shop_role := public.get_user_shop_role(p_user_id, p_shop_id);
  return v_shop_role is not null;
end;
$$ language plpgsql security definer stable;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- updated_at triggers
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.handle_updated_at();

create trigger trg_shops_updated_at
  before update on public.shops
  for each row execute function public.handle_updated_at();

create trigger trg_suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.handle_updated_at();

create trigger trg_purchase_orders_updated_at
  before update on public.purchase_orders
  for each row execute function public.handle_updated_at();

create trigger trg_skus_updated_at
  before update on public.skus
  for each row execute function public.handle_updated_at();

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.handle_updated_at();

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.handle_updated_at();

create trigger trg_shop_settings_updated_at
  before update on public.shop_settings
  for each row execute function public.handle_updated_at();

create trigger trg_daily_kharsa_updated_at
  before update on public.daily_kharsa
  for each row execute function public.handle_updated_at();

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================
-- SEED: Superadmin flag
-- After running migration, run this with your email:
-- update public.profiles set is_superadmin = true
-- where id = (select id from auth.users where email = 'your@email.com');
-- ================================================================