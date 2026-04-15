"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";
import type {
  Schedule,
  StockMovementReason,
} from "@/lib/pharma.types";

/**
 * Product management server actions.
 *
 * Covers three flows:
 *   - createProduct: insert a new catalog item
 *   - updateProduct: edit an existing catalog item (price, reorder
 *     point, vault location, active flag)
 *   - adjustStock: insert a row into pharma.stock_movements to
 *     either add stock (purchase receipt, transfer in, adjustment)
 *     or remove it (destruction, recall, transfer out)
 *
 * All require admin. The stock_movements insertion is intentionally
 * append-only — the RLS policy on stock_movements has no UPDATE or
 * DELETE policy, so even from here we can only INSERT rows. This is
 * the DB-level enforcement of the audit trail: admins can correct a
 * bad entry by appending a new adjustment_audit row, but they
 * cannot erase the original.
 */

const VALID_SCHEDULES: Schedule[] = ["S4", "S8", "unscheduled"];

const VALID_REASONS: StockMovementReason[] = [
  "initial_stock",
  "purchase_receipt",
  "order_return",
  "recall",
  "destruction",
  "adjustment_audit",
  "transfer_in",
  "transfer_out",
];

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

// ─── Create product ─────────────────────────────────────────────────

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const sku = field(formData, "sku").toUpperCase();
  const name = field(formData, "name");
  const schedule = field(formData, "schedule") as Schedule;
  const strength = field(formData, "strength") || null;
  const form = field(formData, "form") || null;
  const packSize = field(formData, "pack_size") || null;
  const activeIngredients = field(formData, "active_ingredients") || null;
  const vaultLocation = field(formData, "vault_location") || null;
  const unitPriceDollars = parseFloat(
    field(formData, "unit_price_dollars") || "0"
  );
  const reorderPoint = parseInt(field(formData, "reorder_point") || "0", 10);
  const minOrderQty = parseInt(field(formData, "min_order_qty") || "1", 10);

  const errors: string[] = [];
  if (!sku || sku.length < 2) errors.push("sku_invalid");
  if (!name) errors.push("name_required");
  if (!VALID_SCHEDULES.includes(schedule)) errors.push("schedule_invalid");
  if (isNaN(unitPriceDollars) || unitPriceDollars < 0) {
    errors.push("price_invalid");
  }
  if (isNaN(reorderPoint) || reorderPoint < 0) {
    errors.push("reorder_invalid");
  }
  if (isNaN(minOrderQty) || minOrderQty < 1) {
    errors.push("min_qty_invalid");
  }

  if (errors.length > 0) {
    redirect(
      `/portal/admin/pharma/products/new?error=${errors.join(",")}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pharma_products")
    .insert({
      sku,
      name,
      schedule,
      strength,
      form,
      pack_size: packSize,
      active_ingredients: activeIngredients,
      vault_location: vaultLocation,
      unit_price_cents: Math.round(unitPriceDollars * 100),
      reorder_point: reorderPoint,
      min_order_qty: minOrderQty,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    const code = error?.message.includes("duplicate")
      ? "sku_duplicate"
      : "insert_failed";
    redirect(`/portal/admin/pharma/products/new?error=${code}`);
  }

  revalidatePath("/portal/admin/pharma");
  revalidatePath("/portal/admin/pharma/products");
  redirect(`/portal/admin/pharma/products/${data.id}?notice=created`);
}

// ─── Update product ─────────────────────────────────────────────────

export async function updateProduct(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");

  if (!id) {
    redirect("/portal/admin/pharma/products?error=missing_id");
  }

  const unitPriceDollars = parseFloat(
    field(formData, "unit_price_dollars") || "0"
  );
  const reorderPoint = parseInt(field(formData, "reorder_point") || "0", 10);
  const isActive = field(formData, "is_active") === "on";

  const update: Record<string, unknown> = {
    name: field(formData, "name"),
    strength: field(formData, "strength") || null,
    form: field(formData, "form") || null,
    pack_size: field(formData, "pack_size") || null,
    active_ingredients: field(formData, "active_ingredients") || null,
    vault_location: field(formData, "vault_location") || null,
    unit_price_cents: Math.round(unitPriceDollars * 100),
    reorder_point: isNaN(reorderPoint) ? 0 : reorderPoint,
    is_active: isActive,
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pharma_products")
    .update(update)
    .eq("id", id);

  if (error) {
    redirect(
      `/portal/admin/pharma/products/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/portal/admin/pharma");
  revalidatePath("/portal/admin/pharma/products");
  revalidatePath(`/portal/admin/pharma/products/${id}`);
  redirect(`/portal/admin/pharma/products/${id}?notice=updated`);
}

// ─── Adjust stock ───────────────────────────────────────────────────
//
// Inserts a single row into pharma.stock_movements. The reason
// determines the sign: positive reasons ("purchase_receipt",
// "transfer_in", etc.) need a POSITIVE delta; negative reasons
// ("destruction", "recall", "transfer_out") need a NEGATIVE delta.
// The form collects an absolute quantity + reason, and we flip the
// sign server-side so the admin never has to think about direction.

const NEGATIVE_REASONS: Set<StockMovementReason> = new Set([
  "destruction",
  "recall",
  "transfer_out",
]);

export async function adjustStock(formData: FormData) {
  const adminSession = await requireAdmin();
  const productId = field(formData, "product_id");
  const reason = field(formData, "reason") as StockMovementReason;
  const qty = parseInt(field(formData, "qty") || "0", 10);
  const batchId = field(formData, "batch_id") || null;
  const expiryRaw = field(formData, "expiry_date");
  const expiryDate = expiryRaw || null;
  const notes = field(formData, "notes") || null;

  if (!productId) {
    redirect("/portal/admin/pharma/products?error=missing_id");
  }
  if (!VALID_REASONS.includes(reason)) {
    redirect(
      `/portal/admin/pharma/products/${productId}?error=reason_invalid`
    );
  }
  if (isNaN(qty) || qty <= 0) {
    redirect(
      `/portal/admin/pharma/products/${productId}?error=qty_invalid`
    );
  }

  // Flip sign for negative reasons. adjustment_audit is signed by
  // the admin via a separate "direction" field — for simplicity in
  // the MVP we treat it as positive and rely on admins using other
  // reasons for decrements.
  const signedDelta = NEGATIVE_REASONS.has(reason) ? -qty : qty;

  const supabase = await createClient();
  const { error } = await supabase.from("pharma_stock_movements").insert({
    product_id: productId,
    delta_units: signedDelta,
    reason,
    batch_id: batchId,
    expiry_date: expiryDate,
    actor_user_id: adminSession.userId,
    notes,
  });

  if (error) {
    redirect(
      `/portal/admin/pharma/products/${productId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/portal/admin/pharma");
  revalidatePath("/portal/admin/pharma/products");
  revalidatePath(`/portal/admin/pharma/products/${productId}`);
  redirect(
    `/portal/admin/pharma/products/${productId}?notice=stock_adjusted`
  );
}
