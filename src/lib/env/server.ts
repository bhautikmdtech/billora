import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
    DATABASE_URL: z.string().min(1),

    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),

    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    RESEND_FROM_NAME: z.string().default("ShopFlow ERP"),

    ADMIN_EMAIL: z.string().email().optional(),
    SUPERADMIN_EMAIL: z.string().email().optional(),

    LOG_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
        .default("info"),

    DEFAULT_PAGE_LIMIT: z.coerce.number().int().positive().default(20),
    MAX_PAGE_LIMIT: z.coerce.number().int().positive().default(100),

    DEFAULT_TIMEZONE: z.string().default("Asia/Kolkata"),

    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    STRIPE_SKIP: z.coerce.boolean().default(false),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("❌ Invalid server environment variables");
}

export const serverEnv = parsed.data;

export type ServerEnv = typeof serverEnv;