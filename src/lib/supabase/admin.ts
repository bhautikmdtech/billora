import "server-only"; // ✅ prevents client import

import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/types/database";

export const supabaseAdmin = createClient<Database>(
  serverEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY!, // ✅ REQUIRED
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);