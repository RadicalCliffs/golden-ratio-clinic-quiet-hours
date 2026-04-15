import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * /portal — index page
 *
 * Server-side check: if the visitor has a session, send them to the
 * dashboard. Otherwise, send them to login. Acts as the canonical
 * "enter the portal" entrypoint.
 */
export default async function PortalIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/portal/dashboard");
  } else {
    redirect("/portal/login");
  }
}
