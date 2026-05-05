"use client";

import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env/client"; // ✅ ONLY client env
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
