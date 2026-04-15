import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * OAuth callback handler
 *
 * Supabase redirects here after a successful OAuth flow with a `code`
 * query parameter. We exchange it for a session, then redirect the user
 * to either the `next` parameter or the patient portal dashboard.
 *
 * This is the URL you must add to:
 *   1. Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
 *      Add: http://localhost:3000/auth/callback (dev)
 *      Add: https://yourdomain.com/auth/callback (prod)
 *   2. Google Cloud Console → OAuth 2.0 Client ID → Authorized redirect URIs
 *      Add the Supabase project's auth callback URL:
 *      https://zdepsughnijknjcccmza.supabase.co/auth/v1/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth — forward the user to their destination
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth failed — bounce back to login with an error param
  return NextResponse.redirect(`${origin}/portal/login?error=auth_callback_failed`);
}
