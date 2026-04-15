import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Routes that require an authenticated patient session.
 * Anything matching these prefixes will redirect to /portal/login if
 * the visitor has no Supabase session.
 */
const PROTECTED_PREFIXES = [
  "/portal/dashboard",
  "/portal/profile",
  "/portal/appointments",
  "/portal/prescriptions",
];

/**
 * Routes that should redirect to the dashboard if the visitor is
 * ALREADY authenticated. Stops logged-in patients from re-visiting
 * the login screen.
 */
const AUTH_ONLY_PREFIXES = ["/portal/login", "/portal/signup"];

export const updateSession = async (request: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Defensive: if env vars are missing at runtime (e.g. a Vercel preview
  // deployment before they're configured), no-op gracefully instead of
  // crashing with MIDDLEWARE_INVOCATION_FAILED. Every request to the site
  // just passes through unauthenticated.
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // IMPORTANT: do not run code between createServerClient and getUser.
    // The getUser() call refreshes the session cookies if they've expired.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Block unauthenticated access to protected routes
    if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Bounce already-authenticated users away from login/signup
    if (user && AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/dashboard";
      url.searchParams.delete("next");
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (err) {
    // Any unexpected Supabase SDK error (network, token refresh, etc.)
    // must not crash the entire site. Log it and let the request through
    // unauthenticated — server components that need auth will handle the
    // redirect themselves via their own createClient() calls.
    console.error("[supabase middleware] error:", err);
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }
};
