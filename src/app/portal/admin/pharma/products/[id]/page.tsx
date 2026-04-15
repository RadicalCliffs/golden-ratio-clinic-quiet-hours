import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Package,
} from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import type {
  Product,
  ProductStock,
  StockMovement,
  StockMovementReason,
} from "@/lib/pharma.types";
import {
  formatCents,
  STOCK_REASONS,
  SCHEDULE_LABELS,
} from "@/lib/pharma.types";
import { updateProduct, adjustStock } from "../actions";

/**
 * Product detail + stock adjustment + movement log.
 *
 * Three panels:
 *   1. Edit product form (price, reorder point, vault, active flag)
 *   2. Current stock + adjustment form (inserts into the append-only
 *      stock_movements ledger)
 *   3. Movement history (most-recent first, with batch/lot + reason)
 *
 * The movement history doubles as an audit trail. Each row shows
 * who made the change (actor_user_id) and when. We don't currently
 * join to auth.users to show the actor's name — that requires a
 * VIEW or RPC because `auth.users` isn't directly queryable via
 * PostgREST without elevated privileges.
 */

export const dynamic = "force-dynamic";

const NOTICE_LABELS: Record<string, string> = {
  created: "Product created successfully.",
  updated: "Product updated.",
  stock_adjusted: "Stock movement recorded.",
};

const ERROR_LABELS: Record<string, string> = {
  reason_invalid: "Please choose a valid reason.",
  qty_invalid: "Quantity must be a positive whole number.",
};

export default async function ProductDetailPage({
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

  const [productRes, stockRes, movementsRes] = await Promise.all([
    supabase
      .from("pharma_products")
      .select("*")
      .eq("id", id)
      .maybeSingle<Product>(),
    supabase
      .from("pharma_product_stock")
      .select("*")
      .eq("product_id", id)
      .maybeSingle<ProductStock>(),
    supabase
      .from("pharma_stock_movements")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<StockMovement[]>(),
  ]);

  const product = productRes.data;
  if (!product) {
    notFound();
  }

  const stock = stockRes.data;
  const movements = movementsRes.data ?? [];
  const scheduleMeta = SCHEDULE_LABELS[product.schedule];

  const noticeText = notice ? NOTICE_LABELS[notice] : null;
  const errorText = error
    ? ERROR_LABELS[error] ?? decodeURIComponent(error)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/admin/pharma/products"
          className="inline-flex items-center gap-1.5 text-[12px] mb-4 transition-colors"
          style={{ color: "var(--portal-text-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Product catalog
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p
              className="text-[11px] font-mono mb-1"
              style={{ color: "var(--portal-text-subtle)" }}
            >
              {product.sku}
            </p>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--portal-text)" }}
            >
              {product.name}
            </h1>
            <p
              className="text-[13px] mt-1"
              style={{ color: "var(--portal-text-muted)" }}
            >
              {[product.strength, product.form, product.pack_size]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background:
                scheduleMeta.tone === "danger"
                  ? "var(--portal-danger-soft)"
                  : scheduleMeta.tone === "warn"
                    ? "var(--portal-warning-soft)"
                    : "var(--portal-surface-2)",
              color:
                scheduleMeta.tone === "danger"
                  ? "var(--portal-danger)"
                  : scheduleMeta.tone === "warn"
                    ? "var(--portal-warning)"
                    : "var(--portal-text-muted)",
            }}
          >
            {scheduleMeta.label}
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

      {/* ─── Grid ─── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Edit form */}
          <Card title="Product details">
            <form action={updateProduct} className="space-y-4">
              <input type="hidden" name="id" value={product.id} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Name"
                  name="name"
                  defaultValue={product.name}
                  required
                />
                <Field
                  label="Unit price (AUD)"
                  name="unit_price_dollars"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={(product.unit_price_cents / 100).toFixed(2)}
                  required
                  mono
                />
                <Field
                  label="Strength"
                  name="strength"
                  defaultValue={product.strength ?? ""}
                />
                <Field
                  label="Form"
                  name="form"
                  defaultValue={product.form ?? ""}
                />
                <Field
                  label="Pack size"
                  name="pack_size"
                  defaultValue={product.pack_size ?? ""}
                />
                <Field
                  label="Reorder point"
                  name="reorder_point"
                  type="number"
                  min="0"
                  defaultValue={String(product.reorder_point)}
                  mono
                />
                <Field
                  label="Active ingredients"
                  name="active_ingredients"
                  defaultValue={product.active_ingredients ?? ""}
                  wide
                />
                <Field
                  label="Vault location"
                  name="vault_location"
                  defaultValue={product.vault_location ?? ""}
                  wide
                />
              </div>

              <label
                className="flex items-center gap-2 text-[13px]"
                style={{ color: "var(--portal-text)" }}
              >
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={product.is_active}
                />
                Active (visible in catalog, pharmacists can order)
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "var(--portal-accent)",
                  color: "#fff",
                }}
              >
                Save changes
              </button>
            </form>
          </Card>

          {/* Movement history */}
          <Card
            title="Stock movement history"
            subtitle={`${movements.length} movement${movements.length === 1 ? "" : "s"} (newest first)`}
          >
            {movements.length === 0 ? (
              <p
                className="text-[13px] text-center py-6"
                style={{ color: "var(--portal-text-subtle)" }}
              >
                No movements yet.
              </p>
            ) : (
              <ul
                className="divide-y"
                style={{ borderColor: "var(--portal-border)" }}
              >
                {movements.map((m) => {
                  const reasonMeta = STOCK_REASONS[m.reason];
                  const isIn = m.delta_units > 0;
                  return (
                    <li
                      key={m.id}
                      className="py-3 flex items-center gap-3 text-[12px]"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isIn
                            ? "var(--portal-accent-soft)"
                            : "var(--portal-danger-soft)",
                          color: isIn
                            ? "var(--portal-accent)"
                            : "var(--portal-danger)",
                        }}
                      >
                        {isIn ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold"
                          style={{ color: "var(--portal-text)" }}
                        >
                          {reasonMeta.label}
                        </p>
                        {m.notes && (
                          <p
                            className="text-[11px] truncate"
                            style={{ color: "var(--portal-text-subtle)" }}
                          >
                            {m.notes}
                          </p>
                        )}
                        {m.batch_id && (
                          <p
                            className="text-[10px] font-mono"
                            style={{ color: "var(--portal-text-subtle)" }}
                          >
                            Batch: {m.batch_id}
                            {m.expiry_date && ` · exp ${m.expiry_date}`}
                          </p>
                        )}
                      </div>
                      <span
                        className="font-mono font-bold tabular-nums text-[14px]"
                        style={{
                          color: isIn
                            ? "var(--portal-accent)"
                            : "var(--portal-danger)",
                        }}
                      >
                        {isIn ? "+" : ""}
                        {m.delta_units}
                      </span>
                      <span
                        className="text-[10px] hidden sm:block"
                        style={{ color: "var(--portal-text-subtle)" }}
                      >
                        {new Date(m.created_at).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column — current stock + adjustment form */}
        <aside className="space-y-4">
          <Card title="Current stock">
            <div className="mb-4">
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: "var(--portal-text-subtle)" }}
              >
                On hand
              </p>
              <p
                className="text-4xl font-bold font-mono tabular-nums"
                style={{
                  color: stock?.below_reorder
                    ? "var(--portal-warning)"
                    : "var(--portal-text)",
                }}
              >
                {stock?.stock_on_hand ?? 0}
              </p>
              <p
                className="text-[11px] font-mono mt-1"
                style={{ color: "var(--portal-text-subtle)" }}
              >
                Reorder at {product.reorder_point}
              </p>
              {stock?.below_reorder && (
                <p
                  className="text-[11px] mt-2"
                  style={{ color: "var(--portal-warning)" }}
                >
                  ⚠ Below reorder threshold
                </p>
              )}
            </div>
          </Card>

          <Card title="Adjust stock">
            <form action={adjustStock} className="space-y-3">
              <input type="hidden" name="product_id" value={product.id} />

              <SelectField
                label="Reason"
                name="reason"
                required
                options={[
                  { value: "", label: "Choose reason…" },
                  { value: "purchase_receipt", label: "📦 Purchase receipt" },
                  { value: "order_return", label: "↩ Customer return" },
                  { value: "transfer_in", label: "⬇ Transfer in" },
                  { value: "adjustment_audit", label: "🔢 Audit adjustment" },
                  { value: "destruction", label: "🗑 Destruction" },
                  { value: "recall", label: "⚠ Recall" },
                  { value: "transfer_out", label: "⬆ Transfer out" },
                ]}
              />

              <Field
                label="Quantity"
                name="qty"
                type="number"
                min="1"
                required
                mono
              />

              <Field
                label="Batch / lot"
                name="batch_id"
                placeholder={product.schedule === "S8" ? "Required for S8" : "Optional"}
                mono
                required={product.schedule === "S8"}
              />

              <Field
                label="Expiry date"
                name="expiry_date"
                type="date"
              />

              <Field
                label="Notes"
                name="notes"
                placeholder="Optional"
              />

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-90"
                style={{
                  background: "var(--portal-accent)",
                  color: "#fff",
                }}
              >
                Record movement
              </button>

              <p
                className="text-[10px] leading-relaxed"
                style={{ color: "var(--portal-text-subtle)" }}
              >
                All movements are permanent audit entries. Corrections
                are recorded as new &quot;audit adjustment&quot; rows.
              </p>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ─── Primitives ────────────────────────────────────────────────────

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

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
  mono,
  step,
  min,
  wide,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  mono?: boolean;
  step?: string;
  min?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label
        htmlFor={name}
        className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--portal-text-subtle)" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--portal-danger)" }}> *</span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        step={step}
        min={min}
        className={`w-full px-3 py-2 rounded-lg text-[13px] ${mono ? "font-mono tabular-nums" : ""}`}
        style={{
          background: "var(--portal-surface-2)",
          color: "var(--portal-text)",
          border: "1px solid var(--portal-border)",
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  required,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--portal-text-subtle)" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--portal-danger)" }}> *</span>
        )}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="w-full px-3 py-2 rounded-lg text-[13px]"
        style={{
          background: "var(--portal-surface-2)",
          color: "var(--portal-text)",
          border: "1px solid var(--portal-border)",
        }}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.value === ""}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
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
