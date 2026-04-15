import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildMockAppointments } from "@/lib/portalMockData";

/**
 * GET /api/portal/appointments
 * Returns the authenticated patient's appointments, ordered by
 * scheduled_at asc. RLS ensures only the current user's rows.
 * Falls back to mock data if the table is empty for this user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("scheduled_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      appointments: buildMockAppointments(user.id),
      is_mock: true,
    });
  }

  return NextResponse.json({ appointments: data, is_mock: false });
}
