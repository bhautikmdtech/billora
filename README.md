# ShopFlow ERP

Multi-tenant retail ERP starter built with Next.js App Router, TypeScript, Drizzle ORM, Supabase platform services, Stripe, and a responsive shadcn-style UI foundation.

## What is ready

- Drizzle-backed PostgreSQL schema in [src/db/schema.ts](./src/db/schema.ts)
- SQL migration in [supabase/migrations/202605050001_shopflow_p1_foundation.sql](./supabase/migrations/202605050001_shopflow_p1_foundation.sql)
- Shared utilities for API, env, pagination, logger, Stripe, QR, export, email
- Starter APIs for dashboard, organizations, and shops
- Responsive landing page and workspace page with dark/light theme

## Setup

1. Install dependencies

```bash
npm install
```

2. Create your env file

```bash
cp .env.example .env
```

3. Fill the required values in `.env`

Required minimum for local startup:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

4. Push the database schema

If you want Drizzle to apply the schema directly:

```bash
npm run db:push
```

If you prefer Supabase SQL migrations:

```bash
supabase db push
```

5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run db:generate
npm run db:push
npm run db:studio
```

## Current project direction

This repo is being built in phases. The current pass focuses on a stable foundation:

- database schema and indexes
- shared backend utilities
- starter dashboard and organization/shop flows
- themed UI shell

Modules like POS, purchases, QR print, reports, payroll, full auth flow, and Stripe billing still need their dedicated implementation passes on top of this base.
