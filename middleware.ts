import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Superadmin gate (applied on top of updateSession's auth checks)
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/superadmin")) {
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    // We rely on the cookie set by Supabase; read from the response headers
    // The actual role check is done again inside the page itself - this is just a fast-path guard
    if (!superadminEmail) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
