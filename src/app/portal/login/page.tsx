import Link from "next/link";
import {
  signInWithPassword,
  signInWithGoogle,
  requestMagicLink,
} from "../actions";
import { Lock, Mail, AlertCircle, CheckCircle, Sparkles } from "lucide-react";

/**
 * Patient Portal — Login
 *
 * Two auth methods:
 *   1. Google OAuth (priority) — single click, no password to remember
 *   2. Email + password fallback
 *
 * The form posts to a server action which calls Supabase Auth and
 * redirects to /portal/dashboard on success or back here with an error
 * query param on failure.
 */

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed:
    "We couldn't complete sign-in via Google. Please try again or use email.",
  email_confirmation_failed:
    "Your confirmation link has expired or is invalid. Please request a new one.",
  missing_credentials: "Please enter your email and password.",
  missing_email: "Please enter your email address.",
  session_expired: "Your session has expired. Please sign in again.",
  "Invalid login credentials":
    "That email or password isn't right. Try again, or use Google sign-in.",
};

const NOTICE_MESSAGES: Record<string, string> = {
  check_email:
    "Check your email for a confirmation link to finish setting up your account.",
  magic_link_sent:
    "Magic link sent. Check your inbox (and spam folder) and click the link to sign in.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; next?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error
    ? ERROR_MESSAGES[params.error] ?? params.error
    : null;
  const noticeMessage = params.notice
    ? NOTICE_MESSAGES[params.notice] ?? null
    : null;

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E07856] mb-3">
          Patient Portal
        </p>
        <h1 className="font-serif text-4xl font-semibold text-[#1B1F24] mb-3">
          Welcome back
        </h1>
        <p className="text-[15px] text-[#6B7280] leading-relaxed">
          Sign in to view your appointments, prescriptions, and clinical
          updates from Golden Ratio Clinics.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5DFD0] p-8 shadow-sm">
        {/* Notice / Error banners */}
        {noticeMessage && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-[#F0F9F0] border border-[#A8D4B8]">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#3D8764]" />
            <p className="text-[13px] text-[#1B1F24] leading-relaxed">
              {noticeMessage}
            </p>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <p className="text-[13px] text-red-700 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Google OAuth — priority */}
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border-2 border-[#E5DFD0] bg-white text-[#1B1F24] font-semibold text-[15px] transition-all duration-300 hover:border-[#1B1F24] hover:shadow-md"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[#E5DFD0]" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#9CA3AF] font-semibold">
            Or with email
          </span>
          <div className="flex-1 h-px bg-[#E5DFD0]" />
        </div>

        {/* Email + Password */}
        <form action={signInWithPassword} className="space-y-4">
          {params.next && (
            <input type="hidden" name="next" value={params.next} />
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-[12px] font-semibold text-[#1B1F24] mb-2"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#E5DFD0] bg-[#FBF8F1] text-[#1B1F24] text-[15px] focus:outline-none focus:border-[#E07856] transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-[12px] font-semibold text-[#1B1F24]"
              >
                Password
              </label>
              <Link
                href="/portal/forgot"
                className="text-[12px] font-medium text-[#6B7280] hover:text-[#E07856] transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#E5DFD0] bg-[#FBF8F1] text-[#1B1F24] text-[15px] focus:outline-none focus:border-[#E07856] transition-colors"
                placeholder="At least 8 characters"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-2 py-3.5 rounded-xl bg-[#1B1F24] text-[#FBF8F1] font-semibold text-[15px] transition-all duration-300 hover:bg-[#2D3440]"
          >
            Sign in
          </button>

          {/* Magic-link fallback — lives INSIDE the sign-in form so it
              shares the email input. `formAction` on the button
              overrides the parent form's action, and `formNoValidate`
              skips the password field's required check. */}
          <button
            type="submit"
            formAction={requestMagicLink}
            formNoValidate
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#E5DFD0] text-[13px] font-semibold text-[#6B7280] hover:border-[#E07856] hover:text-[#E07856] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Email me a magic sign-in link instead
          </button>
        </form>

        {/* Links */}
        <p className="text-center text-[13px] text-[#6B7280] mt-6">
          New patient?{" "}
          <Link
            href="/portal/signup"
            className="font-semibold text-[#1B1F24] hover:text-[#E07856] transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>

      {/* Privacy reassurance */}
      <p className="text-center text-[11px] text-[#9CA3AF] mt-6 leading-relaxed max-w-sm mx-auto">
        Your account is secured by Supabase Auth and protected under the
        Australian Privacy Principles. We never share your information with
        third parties.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
