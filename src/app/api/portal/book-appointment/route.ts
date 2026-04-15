import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/portal/book-appointment
 *
 * Logged-in patients bypass the pre-screening call — they're already
 * verified — and can request a follow-up directly with the nurse
 * team. This inserts a `scheduled` row into `appointments` which the
 * clinic admin tools will pick up and confirm.
 *
 * Body:
 *   {
 *     preferred_date: "2026-04-15",
 *     preferred_time: "10:30",
 *     contact_method: "phone" | "video",
 *     appointment_type: "follow_up" | "review",
 *     notes?: string
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

  const preferredDate = String(body.preferred_date ?? "").trim();
  const preferredTime = String(body.preferred_time ?? "").trim();
  const contactMethod = String(body.contact_method ?? "phone").trim();
  const appointmentType = String(body.appointment_type ?? "follow_up").trim();
  const notes = body.notes ? String(body.notes).trim() : null;

  if (!preferredDate || !preferredTime) {
    return NextResponse.json(
      { error: "missing_date_or_time" },
      { status: 400 }
    );
  }

  if (!["phone", "video"].includes(contactMethod)) {
    return NextResponse.json({ error: "invalid_contact_method" }, { status: 400 });
  }

  if (!["follow_up", "review", "initial_consultation"].includes(appointmentType)) {
    return NextResponse.json(
      { error: "invalid_appointment_type" },
      { status: 400 }
    );
  }

  // Combine date + time into a single ISO timestamp (local → UTC)
  const scheduled = new Date(`${preferredDate}T${preferredTime}:00`);
  if (Number.isNaN(scheduled.getTime())) {
    return NextResponse.json({ error: "invalid_datetime" }, { status: 400 });
  }

  if (scheduled.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "datetime_in_the_past" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      appointment_type: appointmentType,
      scheduled_at: scheduled.toISOString(),
      duration_minutes: appointmentType === "initial_consultation" ? 20 : 15,
      contact_method: contactMethod,
      status: "scheduled",
      patient_notes: notes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointment: data }, { status: 201 });
}
