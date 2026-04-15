import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/portal/messages
 *
 * Patient sends a non-urgent message to their care team. Currently
 * this writes into `contact_enquiries` (the existing table) so the
 * clinic team sees it in their existing admin workflow. When a
 * dedicated `portal_messages` table is added, swap the insert target
 * here without touching the dashboard UI.
 *
 * Body:
 *   {
 *     subject: "Question about medication timing",
 *     message: "I wanted to ask..."
 *   }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!message || message.length < 3) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }

  // Look up the patient's name for the clinic staff view
  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("contact_enquiries").insert({
    name:
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "Portal User",
    email: user.email ?? "unknown@example.com",
    phone: profile?.phone ?? null,
    message: subject ? `[Portal] ${subject}\n\n${message}` : `[Portal] ${message}`,
    status: "new",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
