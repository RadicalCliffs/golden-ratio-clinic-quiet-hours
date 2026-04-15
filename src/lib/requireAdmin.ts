import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * Server-side guard that ensures the current user is a staff member
 * of the clinic before rendering a page or running a server action.
 *
 * Returns the authenticated user + their role set if authorised.
 * Redirects to the patient dashboard (or login) otherwise — never
 * returns null so callers can safely destructure without an
 * `if (!result)` branch.
 *
 * ### Why we trust the DB, not the session claims
 *
 * Supabase's JWT includes the user's ID but NOT their custom
 * application roles — we store those in `public.user_roles` and
 * query them via the `has_role()` / `is_staff()` SQL helpers.
 * Querying the DB on every admin request is slightly more
 * expensive than reading claims out of the JWT, but it means:
 *
 *  1. Role changes take effect immediately (no "wait for token
 *     refresh" gap where a fired nurse could still access patient
 *     data for 30 minutes)
 *  2. Role storage lives in one place — the table RLS guards it,
 *     and it's the single source of truth
 *  3. No risk of stale claims if the JWT is copied between
 *     devices or inspected offline
 *
 * The performance cost is one extra SQL round-trip per page load,
 * which is negligible next to the page render itself.
 */

export type StaffRole = "admin" | "nurse" | "doctor";

export type StaffSession = {
  userId: string;
  email: string | null;
  fullName: string | null;
  roles: StaffRole[];
};

/**
 * Require ANY staff role. Use this for pages that all clinic staff
 * can see (e.g. patient list, appointment calendar).
 */
export async function requireStaff(): Promise<StaffSession> {
  const session = await resolveStaffSession();
  if (!session) {
    // Not signed in — bounce to login with a redirect pointer.
    redirect("/portal/login?next=/portal/admin");
  }
  if (session.roles.length === 0) {
    // Signed in, but not staff. Send them back to the patient
    // dashboard so they don't get an error page that reveals the
    // existence of an admin panel.
    redirect("/portal/dashboard");
  }
  return session;
}

/**
 * Require the `admin` role specifically. Use this for pages and
 * actions that mutate other users' data (eligibility approvals,
 * role assignments, profile edits).
 */
export async function requireAdmin(): Promise<StaffSession> {
  const session = await requireStaff();
  if (!session.roles.includes("admin")) {
    redirect("/portal/admin?error=admin_required");
  }
  return session;
}

/**
 * Require a specific clinical role (e.g. "doctor" for prescription
 * issuance). Admins always pass regardless of the requested role —
 * they can do anything a clinician can do.
 */
export async function requireRole(role: StaffRole): Promise<StaffSession> {
  const session = await requireStaff();
  if (!session.roles.includes("admin") && !session.roles.includes(role)) {
    redirect("/portal/admin?error=role_required");
  }
  return session;
}

/**
 * Low-level session resolver. Returns null if not signed in, or a
 * StaffSession with potentially empty `roles` array if the user is
 * signed in but holds no clinic role.
 *
 * Does NOT redirect — callers decide what to do. Used internally by
 * requireStaff/requireAdmin/requireRole, and also exposed in case
 * a page wants to render differently for staff vs non-staff without
 * redirecting.
 */
export async function resolveStaffSession(): Promise<StaffSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Query the role table directly. RLS allows the user to read their
  // own role assignments (via the `users_read_own_roles` policy), so
  // we don't need elevated privileges here.
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (roleRows ?? [])
    .map((r) => r.role as string)
    .filter((r): r is StaffRole =>
      r === "admin" || r === "nurse" || r === "doctor"
    );

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ?? null,
    roles,
  };
}
