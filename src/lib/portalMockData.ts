/**
 * Mock data stub for the patient portal
 *
 * When the Supabase tables are empty (typical for a new signup), the
 * dashboard API endpoints return these mock records so the UI has
 * something to render. The moment a real row is inserted for the user
 * via the clinic admin tools, the real data replaces the mock — no
 * code changes needed.
 *
 * All fields use clinically plausible values but are clearly marked
 * as samples via the `is_mock: true` flag, which the dashboard uses
 * to display a "sample data" banner.
 */

import type {
  PatientProfile,
  Appointment,
  Prescription,
} from "./database.types";

type MockProfile = PatientProfile & { is_mock?: boolean };
type MockAppointment = Appointment & { is_mock?: boolean };
type MockPrescription = Prescription & { is_mock?: boolean };

const now = () => new Date();
const daysFromNow = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};
const isoDate = (n: number): string => daysFromNow(n).split("T")[0];

export function buildMockProfile(
  userId: string,
  fullName: string | null,
  email: string | null
): MockProfile {
  return {
    id: userId,
    full_name: fullName ?? email?.split("@")[0] ?? "New Patient",
    preferred_name: null,
    phone: null,
    date_of_birth: null,
    state: null,
    eligibility_status: "pending",
    eligibility_notes: null,
    approved_at: null,
    approved_by: null,
    avatar_url: null,
    created_at: now().toISOString(),
    updated_at: now().toISOString(),
    is_mock: true,
  };
}

/**
 * True if the given appointment ID is one of our mock stubs rather
 * than a real Supabase row. Used by routes that need to branch
 * between the mock path and the RLS-protected DB lookup.
 *
 * Convention: every mock row's id starts with `mock-appt-`.
 */
export function isMockAppointmentId(id: string): boolean {
  return id.startsWith("mock-appt-");
}

/**
 * Look up a single mock appointment by ID. Takes the already-built
 * mock list so the caller decides which user scope the mock belongs
 * to (mock data is keyed per-user).
 */
export function getMockAppointmentById(
  list: MockAppointment[],
  id: string
): MockAppointment | null {
  return list.find((a) => a.id === id) ?? null;
}

export function buildMockAppointments(userId: string): MockAppointment[] {
  return [
    {
      id: "mock-appt-upcoming",
      user_id: userId,
      appointment_type: "pre_screening",
      scheduled_at: daysFromNow(2),
      duration_minutes: 10,
      practitioner_name: "Nurse Sarah Mitchell",
      practitioner_role: "Registered Nurse",
      contact_method: "phone",
      status: "scheduled",
      patient_notes: null,
      clinical_notes: null,
      created_at: now().toISOString(),
      updated_at: now().toISOString(),
      is_mock: true,
    },
    {
      id: "mock-appt-past",
      user_id: userId,
      appointment_type: "initial_consultation",
      scheduled_at: daysFromNow(-14),
      duration_minutes: 20,
      practitioner_name: "Dr. James Chen",
      practitioner_role: "Australian-Registered Medical Practitioner",
      contact_method: "video",
      status: "completed",
      patient_notes: null,
      clinical_notes: null,
      created_at: daysFromNow(-16),
      updated_at: daysFromNow(-14),
      is_mock: true,
    },
  ];
}

export function buildMockPrescriptions(userId: string): MockPrescription[] {
  return [
    {
      id: "mock-rx-active",
      user_id: userId,
      status: "active",
      prescription_reference: "GRC-2026-0421",
      issued_date: isoDate(-14),
      expiry_date: isoDate(166),
      next_review_date: isoDate(76),
      prescribing_doctor: "Dr. James Chen",
      pharmacy_name: "Compounding Pharmacy Sydney",
      delivery_status: "delivered",
      patient_visible_notes:
        "Sample prescription — your actual prescription details will appear here once issued by your doctor.",
      internal_notes: null,
      created_at: daysFromNow(-14),
      updated_at: daysFromNow(-10),
      is_mock: true,
    },
  ];
}

/**
 * Quick actions shown on the dashboard. These are static (not from DB)
 * because they're UI affordances, not clinical data.
 */
export const QUICK_ACTIONS = [
  {
    id: "book_followup",
    title: "Book a follow-up",
    description:
      "Direct to our nurse team — no pre-screening needed, you're already a patient.",
    icon: "calendar",
    action: "book_followup",
    enabled: true,
  },
  {
    id: "request_refill",
    title: "Request a refill",
    description:
      "Let your doctor know you'd like to continue your current prescription.",
    icon: "pill",
    action: "request_refill",
    enabled: true,
  },
  {
    id: "message_team",
    title: "Message your care team",
    description:
      "Non-urgent clinical questions answered by your nurse within one business day.",
    icon: "message",
    action: "message_team",
    enabled: true,
  },
  {
    id: "view_records",
    title: "View clinical records",
    description: "Access your consultation notes, lab results, and care plan.",
    icon: "folder",
    action: "view_records",
    enabled: true,
  },
] as const;
