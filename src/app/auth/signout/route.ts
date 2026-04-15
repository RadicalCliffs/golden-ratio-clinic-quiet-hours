import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Sign-out endpoint
 *
 * POST-only to prevent CSRF (a malicious site can't force a sign-out
 * via a simple <img src> tag). Clears the Supabase session cookies and
 * redirects to the home page.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 302 });
}
