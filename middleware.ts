import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/app/:path*",
    "/profile/:path*",
    "/superadmin/:path*",
    "/auth/login",
    "/auth/register",
    "/api/orgs/:path*",
    "/api/dashboard/:path*",
    "/api/shops/:path*",
  ],
};

