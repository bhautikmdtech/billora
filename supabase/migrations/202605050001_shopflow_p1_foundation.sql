create extension if not exists pgcrypto;

do $$ begin
  create type org_category as enum ('saree', 'dress', 'kariyana', 'jewellery', 'electronics', 'hardware', 'general');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type org_role as enum ('org_owner', 'partner', 'admin', 'employee');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type shop_role as enum ('admin', 'employee');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type member_status as enum ('active', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type invite_status as enum ('pending', 'accepted', 'expired', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type purchase_order_status as enum ('draft', 'pending', 'partial', 'received', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_method as enum ('cash', 'upi', 'card', 'credit', 'cheque');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type sku_status as enum ('available', 'sold', 'returned_supplier', 'damaged');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type sale_status as enum ('completed', 'partial_return', 'fully_returned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type return_type as enum ('customer_return', 'supplier_return');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type return_status as enum ('pending', 'processed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type expense_category as enum ('salary', 'rent', 'electricity', 'transport', 'maintenance', 'misc', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payroll_status as enum ('pending', 'paid');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type notification_type as enum ('sale', 'low_stock', 'invite', 'payment', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type subscription_interval as enum ('month', 'year');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category org_category not null,
  logo_url text,
  address jsonb,
  phone text,
  email text,
  gst_number text,
  pan_number text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  address jsonb,
  phone text,
  email text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (org_id, code)
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role org_role not null,
  status member_status not null default 'active',
  joined_at timestamptz not null default timezone('utc', now()),
  invited_by uuid references public.profiles(id),
  unique (org_id, user_id)
);

create table if not exists public.shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role shop_role not null,
  salary integer not null default 0,
  status member_status not null default 'active',
  joined_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  invited_email text not null,
  role text not null,
  token text not null unique,
  invited_by uuid references public.profiles(id),
  status invite_status not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  gst_number text,
  balance integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  supplier_id uuid references public.suppliers(id),
  order_number text not null unique,
  status purchase_order_status not null default 'draft',
  subtotal integer not null default 0,
  discount_amount integer not null default 0,
  gst_amount integer not null default 0,
  total_amount integer not null default 0,
  paid_amount integer not null default 0,
  payment_method payment_method,
  invoice_number text,
  invoice_date date,
  notes text,
  attachment_url text,
  received_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  category text,
  sub_category text,
  color text,
  size text,
  description text,
  qty_ordered integer not null default 0,
  qty_received integer not null default 0,
  cost_price integer not null default 0,
  selling_price integer not null default 0,
  mrp integer not null default 0,
  gst_percent numeric(5,2) not null default 0,
  total_cost integer not null default 0
);

create table if not exists public.skus (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  purchase_order_id uuid references public.purchase_orders(id),
  purchase_order_item_id uuid references public.purchase_order_items(id),
  supplier_id uuid references public.suppliers(id),
  sku_code text not null,
  qr_data text not null,
  qr_image_url text,
  category text,
  sub_category text,
  color text,
  size text,
  description text,
  cost_price integer not null default 0,
  selling_price integer not null default 0,
  mrp integer not null default 0,
  gst_percent numeric(5,2) not null default 0,
  status sku_status not null default 'available',
  sold_at timestamptz,
  sold_sale_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, sku_code)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  whatsapp text,
  address jsonb,
  notes text,
  total_purchases integer not null default 0,
  total_spend integer not null default 0,
  last_visit_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  bill_number text not null,
  customer_id uuid references public.customers(id),
  customer_snapshot jsonb,
  subtotal integer not null default 0,
  discount_total integer not null default 0,
  gst_total integer not null default 0,
  grand_total integer not null default 0,
  payment_method payment_method,
  amount_paid integer not null default 0,
  change_returned integer not null default 0,
  status sale_status not null default 'completed',
  bill_sent_whatsapp boolean not null default false,
  bill_sent_email boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, bill_number)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  sku_id uuid references public.skus(id),
  sku_code text,
  category text,
  sub_category text,
  color text,
  size text,
  mrp integer not null default 0,
  selling_price integer not null default 0,
  discount_amount integer not null default 0,
  gst_percent numeric(5,2) not null default 0,
  gst_amount integer not null default 0,
  quantity integer not null default 1
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  type return_type not null,
  reference_id uuid,
  total_refund integer not null default 0,
  refund_method text,
  status return_status not null default 'pending',
  notes text,
  processed_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  sku_id uuid references public.skus(id),
  sku_code text,
  reason text,
  refund_amount integer not null default 0
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  date date not null,
  category expense_category,
  description text,
  amount integer not null default 0,
  payment_method payment_method,
  paid_to text,
  receipt_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null,
  salary integer not null default 0,
  bonus integer not null default 0,
  deduction integer not null default 0,
  net_pay integer not null default 0,
  status payroll_status not null default 'pending',
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  unique (shop_id, user_id, date)
);

create table if not exists public.daily_kharsa (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  date date not null,
  opening_balance integer not null default 0,
  total_sales integer not null default 0,
  total_returns integer not null default 0,
  total_purchases integer not null default 0,
  total_expenses integer not null default 0,
  cash_in_hand integer not null default 0,
  closing_balance integer not null default 0,
  sales_count integer not null default 0,
  is_closed boolean not null default false,
  closed_by uuid references public.profiles(id),
  closed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, date)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  type notification_type,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  action_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  stripe_price_id text,
  plan_name text,
  interval subscription_interval,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  changes jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_organizations_created_at on public.organizations(created_at desc);
create index if not exists idx_shops_org_id on public.shops(org_id);
create index if not exists idx_shops_org_created_at on public.shops(org_id, created_at desc);
create index if not exists idx_org_members_org_user on public.org_members(org_id, user_id);
create index if not exists idx_shop_members_shop_user on public.shop_members(shop_id, user_id);
create index if not exists idx_invites_org_status on public.invites(org_id, status);
create index if not exists idx_suppliers_org_shop on public.suppliers(org_id, shop_id);
create index if not exists idx_purchase_orders_shop_status on public.purchase_orders(shop_id, status);
create index if not exists idx_purchase_order_items_purchase_order_id on public.purchase_order_items(purchase_order_id);
create index if not exists idx_skus_shop_status on public.skus(shop_id, status);
create index if not exists idx_skus_shop_category on public.skus(shop_id, category, sub_category);
create index if not exists idx_skus_qr_data on public.skus(qr_data);
create index if not exists idx_customers_shop_phone on public.customers(shop_id, phone);
create index if not exists idx_sales_shop_created_at on public.sales(shop_id, created_at desc);
create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);
create index if not exists idx_returns_shop_status on public.returns(shop_id, status);
create index if not exists idx_return_items_return_id on public.return_items(return_id);
create index if not exists idx_expenses_shop_date on public.expenses(shop_id, date desc);
create index if not exists idx_payroll_shop_month on public.payroll(shop_id, month);
create index if not exists idx_attendance_shop_date on public.attendance(shop_id, date desc);
create index if not exists idx_daily_kharsa_shop_date on public.daily_kharsa(shop_id, date desc);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_audit_logs_org_shop_created_at on public.audit_logs(org_id, shop_id, created_at desc);
