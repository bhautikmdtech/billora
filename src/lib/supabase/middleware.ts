import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/workspace",
  "/profile",
  "/superadmin",
  "/onboarding",
];

const protectedApiPrefixes = [
  "/api/orgs",
  "/api/dashboard",
  "/api/shops",
  "/api/invites",
  "/api/stripe/checkout",
  "/api/stripe/portal",
];

const guestOnlyPrefixes = ["/auth/login", "/auth/register"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((p) => pathname.startsWith(p));
}

function isProtectedApiPath(pathname: string) {
  return protectedApiPrefixes.some((p) => pathname.startsWith(p));
}

function isGuestOnlyPath(pathname: string) {
  return guestOnlyPrefixes.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated → protected API → 401
  if (!user && isProtectedApiPath(pathname)) {
    return NextResponse.json(
      { success: false, data: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Unauthenticated → protected page → redirect to login
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated → guest-only pages → redirect to workspace
  if (user && isGuestOnlyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";
    return NextResponse.redirect(url);
  }

  return response;
}
