import Link from "next/link";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "../actions";

/**
 * Forgot Password — requests a recovery email via Supabase Auth.
 *
 * The server action always redirects to `?notice=sent` regardless of
 * whether the email exists, to avoid leaking which addresses are
 * registered (a classic account-enumeration defence).
 */

const ERROR_MESSAGES: Record<string, string> = {
  missing_email: "Please enter your email address.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error
    ? ERROR_MESSAGES[params.error] ?? params.error
    : null;
  const sent = params.notice === "sent";

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E07856] mb-3">
          Patient Portal
        </p>
        <h1 className="font-serif text-4xl font-semibold text-[#1B1F24] mb-3">
          Reset your password
        </h1>
        <p className="text-[15px] text-[#6B7280] leading-relaxed">
          Enter the email you used to sign up. If there&apos;s an account,
          we&apos;ll send a secure link to reset your password.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5DFD0] p-8 shadow-sm">
        {sent && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-[#F0F9F0] border border-[#A8D4B8]">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#3D8764]" />
            <p className="text-[13px] text-[#1B1F24] leading-relaxed">
              If an account exists for that email, a password reset link
              is on its way. Check your inbox (and spam folder) in the
              next few minutes.
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

        <form action={requestPasswordReset} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-semibold text-[#1B1F24] mb-2"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#E5DFD0] bg-white text-[15px] focus:outline-none focus:border-[#1B1F24] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-5 py-3.5 rounded-xl bg-[#1B1F24] text-white font-semibold text-[15px] transition-all duration-300 hover:opacity-90"
          >
            Send reset link
          </button>
        </form>

        <Link
          href="/portal/login"
          className="flex items-center justify-center gap-2 mt-6 text-[13px] text-[#6B7280] hover:text-[#1B1F24] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
