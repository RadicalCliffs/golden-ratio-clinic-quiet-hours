"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";
import type { VerificationStatus } from "@/lib/pharma.types";

/**
 * Pharmacist verification actions — approve, reject, suspend,
 * reinstate. All require the admin role (not just any staff).
 *
 * RLS on pharma.pharmacist_profiles only allows admin updates via
 * the `admin_update_any_profile` policy we wrote in the pharma
 * migration, so this is both enforced at the app layer (requireAdmin)
 * and at the DB layer.
 *
 * Each action takes a FormData with at minimum the pharmacist id,
 * and persists the verifier's user id in the profile's verified_by
 * column for audit.
 */

async function readId(form: FormData, field = "id"): Promise<string> {
  const id = String(form.get(field) ?? "");
  if (!id) {
    throw new Error(`missing_${field}`);
  }
  return id;
}

export async function approvePharmacist(formData: FormData) {
  const adminSession = await requireAdmin();
  const id = await readId(formData);

  // Optional credit limit in dollars — the form uses a number field;
  // we convert to cents server-side. Admins typically leave this at
  // $0 until the pharmacy has a track record, then bump it.
  const creditLimitDollars = parseFloat(
    String(formData.get("credit_limit_dollars") ?? "0")
  );
  const creditLimitCents = Math.max(
    0,
    Math.round(isNaN(creditLimitDollars) ? 0 : creditLimitDollars * 100)
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("pharma_pharmacist_profiles")
    .update({
      verification_status: "active" satisfies VerificationStatus,
      verified_at: new Date().toISOString(),
      verified_by: adminSession.userId,
      rejection_reason: null,
      credit_limit_cents: creditLimitCents,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/portal/admin/pharma/pharmacists/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/portal/admin/pharma");
  revalidatePath("/portal/admin/pharma/pharmacists");
  revalidatePath(`/portal/admin/pharma/pharmacists/${id}`);
  redirect(`/portal/admin/pharma/pharmacists/${id}?notice=approved`);
}

export async function rejectPharmacist(formData: FormData) {
  const adminSession = await requireAdmin();
  const id = await readId(formData);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!reason) {
    redirect(
      `/portal/admin/pharma/pharmacists/${id}?error=reason_required`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pharma_pharmacist_profiles")
    .update({
      verification_status: "rejected" satisfies VerificationStatus,
      verified_at: new Date().toISOString(),
      verified_by: adminSession.userId,
      rejection_reason: reason,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/portal/admin/pharma/pharmacists/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/portal/admin/pharma");
  revalidatePath("/portal/admin/pharma/pharmacists");
  revalidatePath(`/portal/admin/pharma/pharmacists/${id}`);
  redirect(`/portal/admin/pharma/pharmacists/${id}?notice=rejected`);
}

export async function suspendPharmacist(formData: FormData) {
  const adminSession = await requireAdmin();
  const id = await readId(formData);
  const reason = String(formData.get("reason") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("pharma_pharmacist_profiles")
    .update({
      verification_status: "suspended" satisfies VerificationStatus,
      verified_at: new Date().toISOString(),
      verified_by: adminSession.userId,
      rejection_reason: reason || "Suspended by admin",
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/portal/admin/pharma/pharmacists/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/portal/admin/pharma");
  revalidatePath(`/portal/admin/pharma/pharmacists/${id}`);
  redirect(`/portal/admin/pharma/pharmacists/${id}?notice=suspended`);
}

export async function reinstatePharmacist(formData: FormData) {
  const adminSession = await requireAdmin();
  const id = await readId(formData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("pharma_pharmacist_profiles")
    .update({
      verification_status: "active" satisfies VerificationStatus,
      verified_at: new Date().toISOString(),
      verified_by: adminSession.userId,
      rejection_reason: null,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/portal/admin/pharma/pharmacists/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/portal/admin/pharma");
  revalidatePath(`/portal/admin/pharma/pharmacists/${id}`);
  redirect(`/portal/admin/pharma/pharmacists/${id}?notice=reinstated`);
}

/**
 * Update the credit limit without changing verification status.
 * Used when an active pharmacy earns a credit upgrade after a
 * track record of on-time payments.
 */
export async function updateCreditLimit(formData: FormData) {
  await requireAdmin();
  const id = await readId(formData);
  const dollars = parseFloat(
    String(formData.get("credit_limit_dollars") ?? "0")
  );
  const cents = Math.max(
    0,
    Math.round(isNaN(dollars) ? 0 : dollars * 100)
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("pharma_pharmacist_profiles")
    .update({ credit_limit_cents: cents })
    .eq("id", id);

  if (error) {
    redirect(
      `/portal/admin/pharma/pharmacists/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/portal/admin/pharma/pharmacists/${id}`);
  redirect(
    `/portal/admin/pharma/pharmacists/${id}?notice=credit_updated`
  );
}
