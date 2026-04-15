import { Lock, AlertCircle } from "lucide-react";
import { updatePassword } from "../actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Reset Password — shown after the user clicks the recovery link from
 * their email. The Supabase email template sends them to
 * /auth/confirm which exchanges the recovery token for a session then
 * redirects here. If we don't have a session, kick them back to login.
 */

const ERROR_MESSAGES: Record<string, string> = {
  too_short: "Password must be at least 8 characters.",
  mismatch: "The two passwords don't match.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // The user must be authenticated (via the recovery link) to see this
  // page. Otherwise bounce them back to request a fresh reset email.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/forgot?error=link_expired");
  }

  const params = await searchParams;
  const errorMessage = params.error
    ? ERROR_MESSAGES[params.error] ?? params.error
    : null;

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E07856] mb-3">
          Patient Portal
        </p>
        <h1 className="font-serif text-4xl font-semibold text-[#1B1F24] mb-3">
          Choose a new password
        </h1>
        <p className="text-[15px] text-[#6B7280] leading-relaxed">
          Pick something strong. At least 8 characters, ideally with a
          mix of letters, numbers and symbols.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5DFD0] p-8 shadow-sm">
        {errorMessage && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <p className="text-[13px] text-red-700 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        )}

        <form action={updatePassword} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-semibold text-[#1B1F24] mb-2"
            >
              New password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#E5DFD0] bg-white text-[15px] focus:outline-none focus:border-[#1B1F24] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-[13px] font-semibold text-[#1B1F24] mb-2"
            >
              Confirm password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#E5DFD0] bg-white text-[15px] focus:outline-none focus:border-[#1B1F24] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-5 py-3.5 rounded-xl bg-[#1B1F24] text-white font-semibold text-[15px] transition-all duration-300 hover:opacity-90"
          >
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
