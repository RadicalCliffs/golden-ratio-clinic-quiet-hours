import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { resolveStaffSession } from "@/lib/requireAdmin";
import DashboardClient from "./client";

/**
 * Patient Dashboard — server shell
 *
 * Server-side auth check. If authenticated, hands control to the
 * client component which handles all data fetching, theme toggling,
 * and modals. The client hits /api/portal/* endpoints that read from
 * Supabase with RLS enforcement.
 *
 * We also resolve the user's staff roles here so the client can
 * conditionally render a "Staff console" link. The link is UI-only
 * — the admin panel re-authorises every request server-side via
 * requireStaff() in its layout.
 */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const staffSession = await resolveStaffSession();
  const isStaff = (staffSession?.roles.length ?? 0) > 0;

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email ?? ""}
      userFullName={
        (user.user_metadata?.full_name as string | undefined) ?? null
      }
      isStaff={isStaff}
    />
  );
}
