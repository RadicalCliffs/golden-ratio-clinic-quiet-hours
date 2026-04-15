import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildIcs } from "@/lib/ics";
import {
  buildMockAppointments,
  isMockAppointmentId,
  getMockAppointmentById,
} from "@/lib/portalMockData";

/**
 * GET /api/portal/appointments/[id]/calendar.ics
 *
 * Returns an RFC 5545 iCalendar file for the requested appointment,
 * authenticated by the patient's session. Serves with the canonical
 * `text/calendar` MIME and a `Content-Disposition: attachment`
 * header so the browser triggers a download (which then opens in the
 * OS's default calendar app).
 *
 * ### Security model
 *
 * 1. The session is resolved server-side from cookies via the
 *    Supabase SSR client. Unauthenticated requests get a 401.
 * 2. The `.select().eq("user_id", user.id)` filter is belt-and-
 *    braces — RLS on `public.appointments` already enforces row
 *    ownership, but an explicit filter makes the intent obvious
 *    and survives any future policy mistake.
 * 3. Mock appointments (IDs starting with `mock-`) are rendered
 *    from the in-memory stub so new patients can test the feature
 *    before the clinic schedules anything real.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Branch 1 — mock appointment (e.g. the sample data shown to new
  // patients who have no real rows yet).
  if (isMockAppointmentId(id)) {
    const mockList = buildMockAppointments(user.id);
    const mock = getMockAppointmentById(mockList, id);
    if (!mock) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return renderIcs(mock, user.email ?? null);
  }

  // Branch 2 — real appointment row, RLS-protected.
  const { data: appt, error } = await supabase
    .from("appointments")
    .select(
      "id, appointment_type, scheduled_at, duration_minutes, practitioner_name, practitioner_role, contact_method, status, patient_notes, updated_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!appt) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return renderIcs(appt, user.email ?? null);
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

type ApptLike = {
  id: string;
  appointment_type: string;
  scheduled_at: string;
  duration_minutes: number | null;
  practitioner_name: string | null;
  practitioner_role?: string | null;
  contact_method: string | null;
  status: string;
  patient_notes: string | null;
  updated_at?: string | null;
};

function renderIcs(appt: ApptLike, userEmail: string | null): NextResponse {
  const start = new Date(appt.scheduled_at);
  const durationMin = appt.duration_minutes ?? 15;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  // Human-friendly title. The appointment_type is an enum token like
  // "initial_consultation" — turn it into "Initial Consultation".
  const title = `Golden Ratio Clinics · ${humaniseType(appt.appointment_type)}`;

  const locationLabel =
    appt.contact_method === "video"
      ? "Video consultation (link will be emailed before the appointment)"
      : "Phone consultation";

  const descLines = [
    `Appointment type: ${humaniseType(appt.appointment_type)}`,
    `Contact method: ${appt.contact_method === "video" ? "Video call" : "Phone call"}`,
    appt.practitioner_name ? `Practitioner: ${appt.practitioner_name}` : null,
    `Duration: ${durationMin} minutes`,
    appt.patient_notes ? `\nYour note: ${appt.patient_notes}` : null,
    userEmail ? `\nBooked by: ${userEmail}` : null,
    `\nNeed to reschedule? Sign in to your patient portal at https://goldenratioclinics.com.au/portal/dashboard`,
  ]
    .filter(Boolean)
    .join("\n");

  // Map our appointment status to the ICS vocabulary.
  const status: "CONFIRMED" | "TENTATIVE" | "CANCELLED" =
    appt.status === "cancelled"
      ? "CANCELLED"
      : appt.status === "scheduled"
        ? "TENTATIVE"
        : "CONFIRMED";

  // Use the row's updated_at epoch as SEQUENCE so re-downloading after
  // an edit replaces the old calendar entry. If the field is missing
  // (mocks, brand-new rows) default to 0.
  const sequence = appt.updated_at
    ? Math.floor(new Date(appt.updated_at).getTime() / 1000)
    : 0;

  const ics = buildIcs({
    uid: appt.id,
    title,
    start,
    end,
    description: descLines,
    location: locationLabel,
    status,
    sequence,
  });

  const filename = `golden-ratio-${humaniseType(appt.appointment_type)
    .toLowerCase()
    .replace(/\s+/g, "-")}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Never let an intermediate cache this — the ICS may include
      // patient-specific details and an updated SEQUENCE number.
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

function humaniseType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
