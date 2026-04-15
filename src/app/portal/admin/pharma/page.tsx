import Link from "next/link";
import {
  Users,
  Package,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import type {
  PharmacistProfile,
  Order,
  ProductStock,
} from "@/lib/pharma.types";
import {
  formatCents,
  ORDER_STATUS_LABELS,
  VERIFICATION_LABELS,
} from "@/lib/pharma.types";

/**
 * Pharma operations home — the first screen admin/operations staff
 * see when they enter the pharma section of the staff console.
 *
 * Same information architecture as the main /portal/admin home:
 *   1. Stat tiles surface volume at a glance
 *   2. Queue cards surface what needs action
 *
 * The data model for each tile is deliberately cheap — every count
 * query uses `{ count: 'exact', head: true }` so PostgREST returns
 * just the count header without shipping any rows. The queue cards
 * pull small slices (top 10, top 8) so render time is bounded.
 *
 * Access: staff-only (`requireStaff`) since nurses/doctors should
 * be able to look at operations too. Destructive actions on
 * sub-pages call `requireAdmin` separately.
 */

export const dynamic = "force-dynamic";

export default async function PharmaAdminHomePage() {
  await requireStaff();
  const supabase = await createClient();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Parallel count queries
  const [
    totalPharmacistsRes,
    pendingPharmacistsRes,
    activeProductsRes,
    pendingOrdersRes,
    inFlightOrdersRes,
    revenueTodayRes,
  ] = await Promise.all([
    supabase
      .from("pharma_pharmacist_profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("pharma_pharmacist_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase
      .from("pharma_products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("pharma_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("pharma_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmed", "picking", "dispatched"]),
    // Revenue today — sum of total_cents on orders created today
    supabase
      .from("pharma_orders")
      .select("total_cents")
      .gte("created_at", startOfToday.toISOString())
      .not("status", "in", "(draft,cancelled)"),
  ]);

  const revenueToday = (revenueTodayRes.data ?? []).reduce(
    (sum, r) => sum + (r.total_cents ?? 0),
    0
  );

  // Queue data
  const [pendingListRes, stockAlertsRes, recentOrdersRes] =
    await Promise.all([
      supabase
        .from("pharma_pharmacist_profiles")
        .select("*")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true })
        .limit(5)
        .returns<PharmacistProfile[]>(),
      supabase
        .from("pharma_product_stock")
        .select("*")
        .eq("below_reorder", true)
        .order("stock_on_hand", { ascending: true })
        .limit(8)
        .returns<ProductStock[]>(),
      supabase
        .from("pharma_orders")
        .select("*")
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(5)
        .returns<Order[]>(),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1"
          style={{ color: "var(--portal-text-subtle)" }}
        >
          Pharma operations
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold"
          style={{ color: "var(--portal-text)" }}
        >
          Wholesale dashboard
        </h1>
        <p
          className="text-[14px] mt-1"
          style={{ color: "var(--portal-text-muted)" }}
        >
          Verify pharmacists, manage inventory, fulfil orders.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatTile
          label="Pharmacists"
          value={totalPharmacistsRes.count ?? 0}
          icon={Users}
          href="/portal/admin/pharma/pharmacists"
        />
        <StatTile
          label="Pending review"
          value={pendingPharmacistsRes.count ?? 0}
          icon={Clock}
          tone="warn"
          href="/portal/admin/pharma/pharmacists?filter=pending"
        />
        <StatTile
          label="Active products"
          value={activeProductsRes.count ?? 0}
          icon={Package}
          href="/portal/admin/pharma/products"
        />
        <StatTile
          label="Pending orders"
          value={pendingOrdersRes.count ?? 0}
          icon={ShoppingBag}
          tone="info"
          href="/portal/admin/pharma/orders?filter=pending"
        />
        <StatTile
          label="In-flight"
          value={inFlightOrdersRes.count ?? 0}
          icon={Activity}
          href="/portal/admin/pharma/orders?filter=in_flight"
        />
        <StatTile
          label="Revenue today"
          value={formatCents(revenueToday)}
          icon={CheckCircle2}
          tone="success"
          monoValue
        />
      </div>

      {/* Two-column queue grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending pharmacists */}
        <Card
          title="Pending pharmacists"
          subtitle="Applications awaiting AHPRA verification"
          action={{
            label: "All",
            href: "/portal/admin/pharma/pharmacists?filter=pending",
          }}
        >
          {pendingListRes.data && pendingListRes.data.length > 0 ? (
            <ul
              className="divide-y"
              style={{ borderColor: "var(--portal-border)" }}
            >
              {pendingListRes.data.map((p) => (
                <li key={p.id} className="py-3">
                  <Link
                    href={`/portal/admin/pharma/pharmacists/${p.id}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[13px] font-semibold truncate"
                        style={{ color: "var(--portal-text)" }}
                      >
                        {p.pharmacy_name}
                      </p>
                      <p
                        className="text-[11px] font-mono mt-0.5"
                        style={{ color: "var(--portal-text-subtle)" }}
                      >
                        {p.ahpra_number} · {p.state}
                      </p>
                    </div>
                    <StatusPill
                      label={VERIFICATION_LABELS[p.verification_status].label}
                      tone={VERIFICATION_LABELS[p.verification_status].tone}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow
              icon={CheckCircle2}
              text="No applications waiting."
            />
          )}
        </Card>

        {/* Stock alerts */}
        <Card
          title="Stock alerts"
          subtitle="Products below reorder point"
          action={{
            label: "Catalog",
            href: "/portal/admin/pharma/products",
          }}
        >
          {stockAlertsRes.data && stockAlertsRes.data.length > 0 ? (
            <ul
              className="divide-y"
              style={{ borderColor: "var(--portal-border)" }}
            >
              {stockAlertsRes.data.map((s) => (
                <li key={s.product_id} className="py-3">
                  <Link
                    href={`/portal/admin/pharma/products/${s.product_id}`}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-mono font-bold flex-shrink-0"
                      style={{
                        background:
                          s.schedule === "S8"
                            ? "var(--portal-danger-soft)"
                            : "var(--portal-warning-soft)",
                        color:
                          s.schedule === "S8"
                            ? "var(--portal-danger)"
                            : "var(--portal-warning)",
                      }}
                    >
                      {s.schedule}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] font-semibold truncate"
                        style={{ color: "var(--portal-text)" }}
                      >
                        {s.name}
                      </p>
                      <p
                        className="text-[11px] font-mono"
                        style={{ color: "var(--portal-text-subtle)" }}
                      >
                        {s.sku}
                      </p>
                    </div>
                    <span
                      className="font-mono text-[13px] font-bold tabular-nums"
                      style={{ color: "var(--portal-warning)" }}
                    >
                      {s.stock_on_hand}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow
              icon={CheckCircle2}
              text="All products comfortably stocked."
            />
          )}
        </Card>
      </div>

      {/* Recent pending orders */}
      <Card
        title="Pending orders"
        subtitle="Submitted — awaiting confirmation"
        action={{
          label: "All orders",
          href: "/portal/admin/pharma/orders",
        }}
      >
        {recentOrdersRes.data && recentOrdersRes.data.length > 0 ? (
          <ul
            className="divide-y"
            style={{ borderColor: "var(--portal-border)" }}
          >
            {recentOrdersRes.data.map((o) => (
              <li key={o.id} className="py-3">
                <Link
                  href={`/portal/admin/pharma/orders/${o.id}`}
                  className="flex items-center gap-4"
                >
                  <p
                    className="text-[13px] font-mono font-semibold"
                    style={{ color: "var(--portal-text)" }}
                  >
                    #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p
                    className="text-[12px]"
                    style={{ color: "var(--portal-text-muted)" }}
                  >
                    {new Date(o.submitted_at ?? o.created_at).toLocaleString("en-AU")}
                  </p>
                  <span
                    className="ml-auto font-mono text-[13px] font-bold tabular-nums"
                    style={{ color: "var(--portal-text)" }}
                  >
                    {formatCents(o.total_cents)}
                  </span>
                  <StatusPill
                    label={ORDER_STATUS_LABELS[o.status].label}
                    tone={ORDER_STATUS_LABELS[o.status].tone}
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow
            icon={CheckCircle2}
            text="No submitted orders waiting."
          />
        )}
      </Card>
    </div>
  );
}

// ─── Components ─────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon: Icon,
  href,
  tone = "neutral",
  monoValue,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  href?: string;
  tone?: "neutral" | "warn" | "info" | "success";
  monoValue?: boolean;
}) {
  const toneBg: Record<string, string> = {
    neutral: "var(--portal-accent-soft)",
    warn: "var(--portal-warning-soft)",
    info: "var(--portal-info-soft)",
    success: "var(--portal-accent-soft)",
  };
  const toneFg: Record<string, string> = {
    neutral: "var(--portal-accent)",
    warn: "var(--portal-warning)",
    info: "var(--portal-info)",
    success: "var(--portal-accent)",
  };

  const display =
    typeof value === "number" ? value.toLocaleString("en-AU") : value;

  const inner = (
    <div
      className="p-4 rounded-2xl h-full transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--portal-surface)",
        border: "1px solid var(--portal-border)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
        style={{ background: toneBg[tone], color: toneFg[tone] }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p
        className={`text-xl sm:text-2xl font-bold leading-none ${monoValue ? "font-mono tabular-nums" : ""}`}
        style={{ color: "var(--portal-text)" }}
      >
        {display}
      </p>
      <p
        className="text-[11px] mt-1.5 font-medium"
        style={{ color: "var(--portal-text-muted)" }}
      >
        {label}
      </p>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
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
      <header className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2
            className="text-[16px] font-bold"
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
        </div>
        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap"
            style={{ color: "var(--portal-accent)" }}
          >
            {action.label}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

function EmptyRow({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  text: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-8 gap-2"
      style={{ color: "var(--portal-text-subtle)" }}
    >
      <Icon className="w-6 h-6" />
      <p className="text-[13px]">{text}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "info" | "success" | "warn" | "danger" | "neutral";
}) {
  const toneColors: Record<string, { bg: string; fg: string }> = {
    info: {
      bg: "var(--portal-info-soft)",
      fg: "var(--portal-info)",
    },
    success: {
      bg: "var(--portal-accent-soft)",
      fg: "var(--portal-accent)",
    },
    warn: {
      bg: "var(--portal-warning-soft)",
      fg: "var(--portal-warning)",
    },
    danger: {
      bg: "var(--portal-danger-soft)",
      fg: "var(--portal-danger)",
    },
    neutral: {
      bg: "var(--portal-surface-2)",
      fg: "var(--portal-text-muted)",
    },
  };
  const c = toneColors[tone];
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}
