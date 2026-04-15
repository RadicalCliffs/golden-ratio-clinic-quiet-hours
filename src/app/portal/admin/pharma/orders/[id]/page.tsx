import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  XCircle,
  MapPin,
} from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import type {
  Order,
  OrderItem,
  Product,
  PharmacistProfile,
  OrderStatus,
} from "@/lib/pharma.types";
import {
  formatCents,
  ORDER_STATUS_LABELS,
} from "@/lib/pharma.types";
import {
  confirmOrder,
  startPicking,
  markDispatched,
  markDelivered,
  cancelOrder,
} from "../actions";

/**
 * Admin order detail — line items + customer + fulfillment actions.
 *
 * The action panel changes based on current status. Each action is
 * a server action form that transitions to the next status and
 * timestamps the transition. The full status flow:
 *
 *   submitted → confirmed → picking → dispatched → delivered
 *
 * With cancellation available at any stage before dispatch. Post-
 * dispatch cancellations need a manual stock refund via the product
 * stock adjust form — we don't auto-refund here because the physical
 * goods may already be en route.
 */

export const dynamic = "force-dynamic";

const NOTICE_LABELS: Record<string, string> = {
  confirmed: "Order confirmed.",
  picking: "Order moved to picking.",
  dispatched: "Order dispatched.",
  delivered: "Order marked as delivered.",
  cancelled: "Order cancelled.",
};

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { notice, error } = await searchParams;

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("pharma_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle<Order>();

  if (!order) {
    notFound();
  }

  const [itemsRes, pharmacistRes] = await Promise.all([
    supabase
      .from("pharma_order_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true })
      .returns<OrderItem[]>(),
    supabase
      .from("pharma_pharmacist_profiles")
      .select("*")
      .eq("id", order.pharmacist_id)
      .maybeSingle<PharmacistProfile>(),
  ]);

  const items = itemsRes.data ?? [];
  const pharmacy = pharmacistRes.data;

  // Fetch product details for each line
  const productIds = items.map((i) => i.product_id);
  let productMap = new Map<string, Product>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("pharma_products")
      .select("*")
      .in("id", productIds)
      .returns<Product[]>();
    productMap = new Map((products ?? []).map((p) => [p.id, p]));
  }

  const statusMeta = ORDER_STATUS_LABELS[order.status];
  const noticeText = notice ? NOTICE_LABELS[notice] : null;
  const errorText = error ? decodeURIComponent(error) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/admin/pharma/orders"
          className="inline-flex items-center gap-1.5 text-[12px] mb-4 transition-colors"
          style={{ color: "var(--portal-text-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All orders
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1"
              style={{ color: "var(--portal-text-subtle)" }}
            >
              Order
            </p>
            <h1
              className="text-3xl font-mono font-bold"
              style={{ color: "var(--portal-text)" }}
            >
              #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p
              className="text-[13px] mt-1"
              style={{ color: "var(--portal-text-muted)" }}
            >
              Placed {new Date(order.created_at).toLocaleString("en-AU")}
              {order.submitted_at &&
                ` · Submitted ${new Date(order.submitted_at).toLocaleString("en-AU")}`}
            </p>
          </div>
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background:
                statusMeta.tone === "success"
                  ? "var(--portal-accent-soft)"
                  : statusMeta.tone === "warn"
                    ? "var(--portal-warning-soft)"
                    : statusMeta.tone === "info"
                      ? "var(--portal-info-soft)"
                      : "var(--portal-surface-2)",
              color:
                statusMeta.tone === "success"
                  ? "var(--portal-accent)"
                  : statusMeta.tone === "warn"
                    ? "var(--portal-warning)"
                    : statusMeta.tone === "info"
                      ? "var(--portal-info)"
                      : "var(--portal-text-muted)",
            }}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      {noticeText && (
        <Banner tone="success" icon={CheckCircle2}>
          {noticeText}
        </Banner>
      )}
      {errorText && (
        <Banner tone="warn" icon={AlertCircle}>
          {errorText}
        </Banner>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left — line items */}
        <div className="space-y-6">
          <Card
            title="Line items"
            subtitle={`${items.length} line${items.length === 1 ? "" : "s"}`}
          >
            <ul
              className="divide-y"
              style={{ borderColor: "var(--portal-border)" }}
            >
              {items.map((item) => {
                const product = productMap.get(item.product_id);
                return (
                  <li
                    key={item.id}
                    className="py-3 flex items-start gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          product?.schedule === "S8"
                            ? "var(--portal-danger-soft)"
                            : product?.schedule === "S4"
                              ? "var(--portal-warning-soft)"
                              : "var(--portal-surface-2)",
                        color:
                          product?.schedule === "S8"
                            ? "var(--portal-danger)"
                            : product?.schedule === "S4"
                              ? "var(--portal-warning)"
                              : "var(--portal-text-muted)",
                      }}
                    >
                      <span className="text-[10px] font-mono font-bold">
                        {product?.schedule ?? "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[11px] font-mono"
                        style={{ color: "var(--portal-text-subtle)" }}
                      >
                        {product?.sku ?? "—"}
                      </p>
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: "var(--portal-text)" }}
                      >
                        {product?.name ?? "Unknown product"}
                      </p>
                      {product && (
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--portal-text-muted)" }}
                        >
                          {[
                            product.strength,
                            product.form,
                            product.pack_size,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-[11px] font-mono"
                        style={{ color: "var(--portal-text-subtle)" }}
                      >
                        {item.qty} ×{" "}
                        {formatCents(item.unit_price_cents)}
                      </p>
                      <p
                        className="text-[14px] font-mono font-bold tabular-nums"
                        style={{ color: "var(--portal-text)" }}
                      >
                        {formatCents(item.line_total_cents)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div
              className="border-t mt-3 pt-4 flex items-center justify-between"
              style={{ borderColor: "var(--portal-border)" }}
            >
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--portal-text-subtle)" }}
              >
                Total
              </span>
              <span
                className="text-xl font-mono font-bold tabular-nums"
                style={{ color: "var(--portal-text)" }}
              >
                {formatCents(order.total_cents)}
              </span>
            </div>
          </Card>

          {/* Customer panel */}
          {pharmacy && (
            <Card title="Customer">
              <Link
                href={`/portal/admin/pharma/pharmacists/${pharmacy.id}`}
                className="block"
              >
                <p
                  className="text-[14px] font-semibold"
                  style={{ color: "var(--portal-text)" }}
                >
                  {pharmacy.pharmacy_name}
                </p>
                <p
                  className="text-[12px] font-mono mt-0.5"
                  style={{ color: "var(--portal-text-muted)" }}
                >
                  {pharmacy.ahpra_number} · {pharmacy.email}
                </p>
                <p
                  className="text-[12px] mt-2"
                  style={{ color: "var(--portal-text-muted)" }}
                >
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {pharmacy.street_address}, {pharmacy.suburb}{" "}
                  {pharmacy.state} {pharmacy.postcode}
                </p>
              </Link>
            </Card>
          )}
        </div>

        {/* Right — fulfillment actions */}
        <aside className="space-y-4">
          <Card title="Fulfillment">
            <FulfillmentActions order={order} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ─── Fulfillment action matrix ─────────────────────────────────────

function FulfillmentActions({ order }: { order: Order }) {
  const id = order.id;

  if (order.status === "cancelled") {
    return (
      <div>
        <p
          className="text-[13px] mb-2"
          style={{ color: "var(--portal-text-muted)" }}
        >
          This order was cancelled
          {order.cancelled_at &&
            ` on ${new Date(order.cancelled_at).toLocaleDateString("en-AU")}`}
          .
        </p>
        {order.cancellation_reason && (
          <p
            className="text-[11px] mt-2 p-2 rounded"
            style={{
              background: "var(--portal-surface-2)",
              color: "var(--portal-text-muted)",
            }}
          >
            Reason: {order.cancellation_reason}
          </p>
        )}
      </div>
    );
  }

  if (order.status === "delivered") {
    return (
      <p
        className="text-[13px]"
        style={{ color: "var(--portal-accent)" }}
      >
        ✓ This order has been delivered.
      </p>
    );
  }

  const canCancel = ["submitted", "confirmed", "picking"].includes(
    order.status
  );

  return (
    <div className="space-y-3">
      {/* Next-step action */}
      {order.status === "submitted" && (
        <form action={confirmOrder}>
          <input type="hidden" name="id" value={id} />
          <ActionButton icon={CheckCircle2} label="Confirm order" primary />
        </form>
      )}
      {order.status === "confirmed" && (
        <form action={startPicking}>
          <input type="hidden" name="id" value={id} />
          <ActionButton icon={Package} label="Start picking" primary />
        </form>
      )}
      {order.status === "picking" && (
        <form action={markDispatched} className="space-y-2">
          <input type="hidden" name="id" value={id} />
          <input
            type="text"
            name="tracking_number"
            placeholder="Tracking number (optional)"
            className="w-full px-3 py-2 rounded-lg text-[12px] font-mono"
            style={{
              background: "var(--portal-surface-2)",
              color: "var(--portal-text)",
              border: "1px solid var(--portal-border)",
            }}
          />
          <ActionButton icon={Truck} label="Mark dispatched" primary />
        </form>
      )}
      {order.status === "dispatched" && (
        <form action={markDelivered}>
          <input type="hidden" name="id" value={id} />
          <ActionButton icon={CheckCircle2} label="Mark delivered" primary />
        </form>
      )}

      {/* Cancel */}
      {canCancel && (
        <form
          action={cancelOrder}
          className="space-y-2 pt-4 border-t"
          style={{ borderColor: "var(--portal-border)" }}
        >
          <input type="hidden" name="id" value={id} />
          <input
            type="text"
            name="cancellation_reason"
            placeholder="Cancellation reason"
            className="w-full px-3 py-2 rounded-lg text-[12px]"
            style={{
              background: "var(--portal-surface-2)",
              color: "var(--portal-text)",
              border: "1px solid var(--portal-border)",
            }}
          />
          <ActionButton icon={XCircle} label="Cancel order" danger />
        </form>
      )}

      {/* Tracking info display */}
      {order.tracking_number && (
        <div
          className="mt-4 p-3 rounded-lg text-[11px]"
          style={{
            background: "var(--portal-surface-2)",
            color: "var(--portal-text-muted)",
          }}
        >
          <p className="font-bold uppercase tracking-wider mb-1">
            Tracking
          </p>
          <p
            className="font-mono"
            style={{ color: "var(--portal-text)" }}
          >
            {order.tracking_number}
          </p>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  primary,
  danger,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-90"
      style={{
        background: primary
          ? "var(--portal-accent)"
          : danger
            ? "transparent"
            : "var(--portal-surface-2)",
        color: primary
          ? "#fff"
          : danger
            ? "var(--portal-danger)"
            : "var(--portal-text)",
        border: danger
          ? "1px solid var(--portal-danger)"
          : primary
            ? "none"
            : "1px solid var(--portal-border)",
      }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-5 sm:p-6"
      style={{
        background: "var(--portal-surface)",
        border: "1px solid var(--portal-border)",
      }}
    >
      <header className="mb-4">
        <h2
          className="text-[15px] font-bold"
          style={{ color: "var(--portal-text)" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-[12px] mt-0.5"
            style={{ color: "var(--portal-text-muted)" }}
          >
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "success" | "warn";
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  const toneColors: Record<string, { bg: string; fg: string; border: string }> = {
    success: {
      bg: "var(--portal-accent-soft)",
      fg: "var(--portal-accent)",
      border: "var(--portal-accent)",
    },
    warn: {
      bg: "var(--portal-warning-soft)",
      fg: "var(--portal-warning)",
      border: "var(--portal-warning)",
    },
  };
  const c = toneColors[tone];
  return (
    <div
      className="rounded-xl p-3 flex items-start gap-2.5"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        style={{ color: c.fg }}
      />
      <p className="text-[13px]" style={{ color: c.fg }}>
        {children}
      </p>
    </div>
  );
}
