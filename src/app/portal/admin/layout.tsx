import Link from "next/link";
import { requireStaff } from "@/lib/requireAdmin";
import AdminHeader from "./header";

/**
 * Admin panel layout — wraps every page under /portal/admin/*.
 *
 * First line of defence for authorisation: calls requireStaff() at
 * the top of the render. Any unauthenticated visitor is bounced to
 * /portal/login, any authenticated non-staff user is bounced to
 * /portal/dashboard. This check also runs for /portal/admin itself
 * because Next.js layouts wrap the matching page.
 *
 * Second line of defence lives in each page component + API route,
 * which re-calls requireStaff/requireAdmin independently. That
 * redundancy is deliberate — if someone later adds a route file
 * under /portal/admin/ that accidentally skips the layout (e.g. a
 * parallel route or a route group), the per-page check still fires.
 *
 * Third line of defence is the RLS policies on every table the
 * admin reads or writes. Even if both JS checks were bypassed, the
 * database would still refuse to hand over non-owned rows.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--portal-bg)", color: "var(--portal-text)" }}
    >
      <AdminHeader
        email={session.email}
        fullName={session.fullName}
        roles={session.roles}
      />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {children}
      </main>
      {/* Footer — brand reminder + sign-out link */}
      <footer
        className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 text-[11px] flex items-center justify-between"
        style={{ color: "var(--portal-text-subtle)" }}
      >
        <span>
          Golden Ratio Clinics · Staff console · {new Date().getFullYear()}
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/portal/dashboard"
            className="hover:underline"
            style={{ color: "var(--portal-text-muted)" }}
          >
            Patient view
          </Link>
          <Link
            href="/auth/signout"
            className="hover:underline"
            style={{ color: "var(--portal-text-muted)" }}
          >
            Sign out
          </Link>
        </div>
      </footer>
    </div>
  );
}
