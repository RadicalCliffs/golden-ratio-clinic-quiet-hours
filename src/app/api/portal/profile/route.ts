import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildMockProfile } from "@/lib/portalMockData";

/**
 * GET /api/portal/profile
 * Returns the authenticated patient's profile. If no row exists (new
 * signup, DB empty), returns a mock stub with `is_mock: true` so the
 * UI can show a "sample data" banner.
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
    .from("patient_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      profile: buildMockProfile(
        user.id,
        (user.user_metadata?.full_name as string | undefined) ?? null,
        user.email ?? null
      ),
    });
  }

  return NextResponse.json({ profile: data });
}

/**
 * PATCH /api/portal/profile
 * Allows the patient to update their own profile fields. RLS enforces
 * that they can only update their own row.
 */
export async function PATCH(request: Request) {
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

  // Allow only safe user-editable fields
  const safeFields = ["full_name", "preferred_name", "phone", "date_of_birth", "state"] as const;
  const update: Record<string, unknown> = {};
  for (const f of safeFields) {
    if (f in body) update[f] = body[f];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_editable_fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("patient_profiles")
    .update(update)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
