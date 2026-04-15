"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Server actions for the patient portal auth flows.
 *
 * These run server-side only — never expose Supabase service role keys
 * to the client. The form data is validated, then passed to the
 * Supabase auth client which handles cookie/session management via the
 * @supabase/ssr middleware adapter.
 */

// ─── Email + Password Sign In ─────────────────────────────────────
export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/portal/dashboard");

  if (!email || !password) {
    redirect("/portal/login?error=missing_credentials");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/portal/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

// ─── Email + Password Sign Up ─────────────────────────────────────
export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password || password.length < 8) {
    redirect("/portal/signup?error=invalid_input");
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    headerList.get("x-forwarded-host") ??
    "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin.startsWith("http") ? origin : `https://${origin}`}/auth/confirm?next=/portal/dashboard`,
    },
  });

  if (error) {
    redirect(`/portal/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/portal/login?notice=check_email");
}

// ─── Google OAuth Sign In ─────────────────────────────────────────
export async function signInWithGoogle() {
  const supabase = await createClient();
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/portal/dashboard`,
    },
  });

  if (error) {
    redirect(`/portal/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }
}

// ─── Request Password Reset Email ─────────────────────────────────
//
// Triggers Supabase Auth's built-in "recovery" email template. The
// link in the email lands on /auth/confirm with `type=recovery`, which
// exchanges the token for a session and redirects to the reset form.
//
// We ALWAYS redirect to the "check your email" notice regardless of
// whether the address exists — leaking which emails are registered is
// a known enumeration vulnerability.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/portal/forgot?error=missing_email");
  }

  const supabase = await createClient();
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/portal/reset-password`,
  });

  // Don't branch on the error — always show the same message so the
  // endpoint can't be used to enumerate valid email addresses.
  redirect("/portal/forgot?notice=sent");
}

// ─── Update Password (called from the reset-password form) ────────
export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect("/portal/reset-password?error=too_short");
  }
  if (password !== confirm) {
    redirect("/portal/reset-password?error=mismatch");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login?error=session_expired");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/portal/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/portal/dashboard?notice=password_updated");
}

// ─── Request Magic Link (passwordless sign-in) ────────────────────
//
// Uses Supabase Auth's OTP email template. One click on the link in
// the email signs the user in. Nicest fallback when a patient forgets
// their password and just wants to get in.
export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/portal/login?error=missing_email");
  }

  const supabase = await createClient();
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/portal/dashboard`,
      // shouldCreateUser defaults to true — new patients can sign up
      // via magic link without ever setting a password.
    },
  });

  redirect("/portal/login?notice=magic_link_sent");
}

// ─── Sign Out (also exposed via /auth/signout route handler) ─────
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
