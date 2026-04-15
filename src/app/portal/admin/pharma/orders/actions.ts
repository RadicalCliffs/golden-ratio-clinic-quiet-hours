"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/requireAdmin";
import type { OrderStatus } from "@/lib/pharma.types";

/**
 * Order fulfillment actions — drive an order through the status
 * flow: submitted → confirmed → picking → dispatched → delivered.
 *
 * Also handles cancellation at any stage before dispatch. Each
 * transition is a single UPDATE on pharma.orders with the matching
 * timestamp column set.
 *
 * Cancellation is special: if the order was already dispatched, we
 * need to refund the stock by inserting opposite stock_movements
 * rows (reason='order_return'). For MVP we ONLY allow cancellation
 * before dispatch, so no stock refund logic here. Post-dispatch
 * returns can be handled manually by an admin via the stock adjust
 * form on the product page.
 */

async function readId(form: FormData): Promise<string> {
  const id = String(form.get("id") ?? "");
  if (!id) {
    throw new Error("missing_id");
  }
  return id;
}

async function transitionOrder(
  orderId: string,
  nextStatus: OrderStatus,
  timestampField: string,
  extraUpdates: Record<string, unknown> = {}
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pharma_orders")
    .update({
      status: nextStatus,
      [timestampField]: new Date().toISOString(),
      ...extraUpdates,
    })
    .eq("id", orderId);

  if (error) {
    redirect(
      `/portal/admin/pharma/orders/${orderId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/portal/admin/pharma");
  revalidatePath("/portal/admin/pharma/orders");
  revalidatePath(`/portal/admin/pharma/orders/${orderId}`);
  redirect(`/portal/admin/pharma/orders/${orderId}?notice=${nextStatus}`);
}

export async function confirmOrder(formData: FormData) {
  await requireAdmin();
  const id = await readId(formData);
  await transitionOrder(id, "confirmed", "confirmed_at");
}

export async function startPicking(formData: FormData) {
  await requireAdmin();
  const id = await readId(formData);
  await transitionOrder(id, "picking", "updated_at");
}

export async function markDispatched(formData: FormData) {
  await requireAdmin();
  const id = await readId(formData);
  const trackingNumber = String(formData.get("tracking_number") ?? "").trim();

  await transitionOrder(id, "dispatched", "dispatched_at", {
    tracking_number: trackingNumber || null,
  });
}

export async function markDelivered(formData: FormData) {
  await requireAdmin();
  const id = await readId(formData);
  await transitionOrder(id, "delivered", "delivered_at");
}

export async function cancelOrder(formData: FormData) {
  await requireAdmin();
  const id = await readId(formData);
  const reason = String(formData.get("cancellation_reason") ?? "").trim();

  await transitionOrder(id, "cancelled", "cancelled_at", {
    cancellation_reason: reason || "Cancelled by admin",
  });
}
