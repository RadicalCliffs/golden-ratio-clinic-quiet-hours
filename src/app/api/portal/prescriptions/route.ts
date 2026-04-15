import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildMockPrescriptions } from "@/lib/portalMockData";

/**
 * GET /api/portal/prescriptions
 * Returns the authenticated patient's prescriptions, most recent
 * first. RLS enforces isolation. Mock fallback when table is empty.
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
    .from("prescriptions")
    .select("*")
    .order("issued_date", { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      prescriptions: buildMockPrescriptions(user.id),
      is_mock: true,
    });
  }

  return NextResponse.json({ prescriptions: data, is_mock: false });
}
