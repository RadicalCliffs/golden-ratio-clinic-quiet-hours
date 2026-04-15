import Link from "next/link";
import { ShoppingBag, ArrowRight, Search } from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import type {
  Order,
  PharmacistProfile,
} from "@/lib/pharma.types";
import {
  formatCents,
  ORDER_STATUS_LABELS,
} from "@/lib/pharma.types";

/**
 * Orders list — staff-visible view of every pharmacy order across
 * the whole B2B operation. Filter by status, search by order ID or
 * pharmacy name.
 *
 * The pharmacist name is shown alongside each order row — we fetch
 * the profiles in a second query and build a lookup map, because
 * PostgREST's built-in `.select(...pharmacist:pharma_pharmacist_profiles(*))`
 * join syntax doesn't cross the view-to-view boundary cleanly.
 */

export const dynamic = "force-dynamic";

const FILTER_OPTIONS: {
  value: string;
  label: string;
  statuses?: Order["status"][];
}[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending", statuses: ["submitted"] },
  {
    value: "in_flight",
    label: "In flight",
    statuses: ["confirmed", "picking", "dispatched"],
  },
  { value: "delivered", label: "Delivered", statuses: ["delivered"] },
  { value: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  await requireStaff();
  const { filter = "pending", q = "" } = await searchParams;

  const supabase = await createClient();

  let orderQuery = supabase
    .from("pharma_orders")
    .select("*")
    .neq("status", "draft") // never show draft (cart) orders to staff
    .order("created_at", { ascending: false });

  const selected = FILTER_OPTIONS.find((f) => f.value === filter);
  if (selected?.statuses) {
    orderQuery = orderQuery.in("status", selected.statuses);
  }

  const { data: orders } = await orderQuery.returns<Order[]>();
  let rows = orders ?? [];

  // Fetch the matching pharmacist profiles for display
  const pharmacistIds = Array.from(
    new Set(rows.map((o) => o.pharmacist_id))
  );
  let pharmacistMap = new Map<string, PharmacistProfile>();
  if (pharmacistIds.length > 0) {
    const { data: profiles } = await supabase
      .from("pharma_pharmacist_profiles")
      .select("*")
      .in("id", pharmacistIds)
      .returns<PharmacistProfile[]>();
    pharmacistMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  }

  // Post-filter search (client-side because search spans columns
  // from two different tables; doing it in SQL would need a dedicated
  // view or RPC)
  if (q.trim()) {
    const term = q.trim().toLowerCase();
    rows = rows.filter((o) => {
      if (o.id.toLowerCase().startsWith(term)) return true;
      const pharmacy = pharmacistMap.get(o.pharmacist_id);
      if (!pharmacy) return false;
      return (
        pharmacy.pharmacy_name.toLowerCase().includes(term) ||
        pharmacy.ahpra_number.toLowerCase().includes(term) ||
        pharmacy.suburb.toLowerCase().includes(term)
      );
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1"
          style={{ color: "var(--portal-text-subtle)" }}
        >
          Pharma operations
        </p>
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--portal-text)" }}
        >
          Orders
        </h1>
        <p
          className="text-[13px] mt-1"
          style={{ color: "var(--portal-text-muted)" }}
        >
          {rows.length} order{rows.length === 1 ? "" : "s"}
          {filter !== "all" && ` · ${selected?.label}`}
          {q && ` · matching "${q}"`}
        </p>
      </div>

      {/* Filters + search */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--portal-surface)",
          border: "1px solid var(--portal-border)",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const active = opt.value === filter;
              const href = `/portal/admin/pharma/orders?filter=${opt.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
              return (
                <Link
                  key={opt.value}
                  href={href}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
                  style={{
                    background: active
                      ? "var(--portal-accent)"
                      : "var(--portal-surface-2)",
                    color: active ? "#fff" : "var(--portal-text-muted)",
                    border: "1px solid var(--portal-border)",
                  }}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
          <form
            method="GET"
            action="/portal/admin/pharma/orders"
            className="ml-auto relative"
          >
            <input type="hidden" name="filter" value={filter} />
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--portal-text-subtle)" }}
            />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search order #, pharmacy…"
              className="pl-9 pr-3 py-2 rounded-lg text-[13px] w-full sm:w-80"
              style={{
                background: "var(--portal-surface-2)",
                color: "var(--portal-text)",
                border: "1px solid var(--portal-border)",
              }}
            />
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: "var(--portal-surface)",
            border: "1px solid var(--portal-border)",
          }}
        >
          <ShoppingBag
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: "var(--portal-text-subtle)" }}
          />
          <p
            className="text-[14px]"
            style={{ color: "var(--portal-text-muted)" }}
          >
            No orders match.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--portal-surface)",
            border: "1px solid var(--portal-border)",
          }}
        >
          <ul
            className="divide-y"
            style={{ borderColor: "var(--portal-border)" }}
          >
            {rows.map((o) => {
              const pharmacy = pharmacistMap.get(o.pharmacist_id);
              const meta = ORDER_STATUS_LABELS[o.status];
              return (
                <li key={o.id}>
                  <Link
                    href={`/portal/admin/pharma/orders/${o.id}`}
                    className="block p-5 transition-colors hover:bg-[var(--portal-surface-2)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p
                            className="text-[13px] font-mono font-bold"
                            style={{ color: "var(--portal-text)" }}
                          >
                            #{o.id.slice(0, 8).toUpperCase()}
                          </p>
                          <StatusPill
                            label={meta.label}
                            tone={meta.tone}
                          />
                        </div>
                        <p
                          className="text-[13px] font-semibold"
                          style={{ color: "var(--portal-text)" }}
                        >
                          {pharmacy?.pharmacy_name ?? "Unknown pharmacy"}
                        </p>
                        <p
                          className="text-[11px] font-mono mt-0.5"
                          style={{ color: "var(--portal-text-subtle)" }}
                        >
                          {pharmacy
                            ? `${pharmacy.ahpra_number} · ${pharmacy.suburb} ${pharmacy.state}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className="text-[15px] font-mono font-bold tabular-nums"
                          style={{ color: "var(--portal-text)" }}
                        >
                          {formatCents(o.total_cents)}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--portal-text-subtle)" }}
                        >
                          {new Date(o.created_at).toLocaleString("en-AU")}
                        </p>
                      </div>
                      <ArrowRight
                        className="w-4 h-4 flex-shrink-0 mt-1"
                        style={{ color: "var(--portal-text-subtle)" }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "info" | "success" | "warn" | "neutral";
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
    neutral: {
      bg: "var(--portal-surface-2)",
      fg: "var(--portal-text-muted)",
    },
  };
  const c = toneColors[tone];
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}
