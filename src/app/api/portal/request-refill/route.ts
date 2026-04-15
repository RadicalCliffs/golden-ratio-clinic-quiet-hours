import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/portal/request-refill
 *
 * Patient signals they'd like to continue their current prescription.
 * For now this creates an appointment with type "review" so a doctor
 * can assess whether a refill is clinically appropriate. When the
 * clinic has a dedicated refill-request table, swap this to insert
 * there instead — the dashboard UI won't need to change.
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
    body = {};
  }

  const prescriptionId = body.prescription_id
    ? String(body.prescription_id)
    : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  // Schedule a review appointment 3 business days out as a default slot
  const reviewDate = new Date();
  let daysAdded = 0;
  while (daysAdded < 3) {
    reviewDate.setDate(reviewDate.getDate() + 1);
    const day = reviewDate.getDay();
    if (day !== 0 && day !== 6) daysAdded += 1;
  }
  reviewDate.setHours(10, 0, 0, 0);

  const patientNotes = [
    "REFILL REQUEST",
    prescriptionId ? `Prescription ID: ${prescriptionId}` : null,
    notes ? `Patient notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      appointment_type: "review",
      scheduled_at: reviewDate.toISOString(),
      duration_minutes: 10,
      contact_method: "phone",
      status: "scheduled",
      patient_notes: patientNotes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointment: data, message: "refill_requested" }, { status: 201 });
}
