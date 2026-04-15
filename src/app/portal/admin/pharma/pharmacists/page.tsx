import Link from "next/link";
import { Search, Users, Clock, ArrowRight } from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import type {
  PharmacistProfile,
  VerificationStatus,
} from "@/lib/pharma.types";
import {
  formatCents,
  VERIFICATION_LABELS,
} from "@/lib/pharma.types";

/**
 * Pharmacists list — searchable, filter by verification status.
 *
 * Filters are URL-driven (`?filter=pending&q=smith`) so the view is
 * shareable + the browser's back button works. Search is a trigram
 * or ILIKE over name + ahpra_number — PostgREST's `.or()` filter
 * supports the pattern `column.ilike.%q%` for each field.
 *
 * Access is staff-read (nurses + doctors can see the list for
 * support/reference). Mutations happen on the detail page with
 * admin-only server actions.
 */

export const dynamic = "force-dynamic";

const FILTER_OPTIONS: {
  value: string;
  label: string;
  status?: VerificationStatus;
}[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending", status: "pending" },
  { value: "active", label: "Verified", status: "active" },
  { value: "suspended", label: "Suspended", status: "suspended" },
  { value: "rejected", label: "Rejected", status: "rejected" },
];

export default async function PharmacistsListPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  await requireStaff();
  const { filter = "all", q = "" } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("pharma_pharmacist_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply status filter
  const selectedFilter = FILTER_OPTIONS.find((f) => f.value === filter);
  if (selectedFilter?.status) {
    query = query.eq("verification_status", selectedFilter.status);
  }

  // Apply free-text search
  if (q.trim()) {
    const term = q.trim().replace(/[%_,]/g, ""); // strip LIKE wildcards
    // Search across pharmacy_name, ahpra_number, email, suburb
    query = query.or(
      `pharmacy_name.ilike.%${term}%,ahpra_number.ilike.%${term}%,email.ilike.%${term}%,suburb.ilike.%${term}%`
    );
  }

  const { data: pharmacists } = await query.returns<PharmacistProfile[]>();
  const rows = pharmacists ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
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
            Pharmacists
          </h1>
          <p
            className="text-[13px] mt-1"
            style={{ color: "var(--portal-text-muted)" }}
          >
            {rows.length} pharmac{rows.length === 1 ? "y" : "ies"}
            {filter !== "all" && ` · filtered by ${selectedFilter?.label}`}
            {q && ` · matching "${q}"`}
          </p>
        </div>
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
          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const active = opt.value === filter;
              const href = `/portal/admin/pharma/pharmacists?filter=${opt.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
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

          {/* Search — GET form so it's URL-driven */}
          <form
            method="GET"
            action="/portal/admin/pharma/pharmacists"
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
              placeholder="Search name, AHPRA, email, suburb…"
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

      {/* List */}
      {rows.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: "var(--portal-surface)",
            border: "1px solid var(--portal-border)",
          }}
        >
          <Users
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: "var(--portal-text-subtle)" }}
          />
          <p
            className="text-[14px]"
            style={{ color: "var(--portal-text-muted)" }}
          >
            No pharmacists match.
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
            {rows.map((p) => {
              const statusMeta =
                VERIFICATION_LABELS[p.verification_status];
              return (
                <li key={p.id}>
                  <Link
                    href={`/portal/admin/pharma/pharmacists/${p.id}`}
                    className="block p-5 transition-colors hover:bg-[var(--portal-surface-2)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className="text-[14px] font-semibold"
                            style={{ color: "var(--portal-text)" }}
                          >
                            {p.pharmacy_name}
                          </p>
                          <StatusPill
                            label={statusMeta.label}
                            tone={statusMeta.tone}
                          />
                        </div>
                        <p
                          className="text-[12px] font-mono mt-0.5"
                          style={{ color: "var(--portal-text-muted)" }}
                        >
                          {p.ahpra_number} · {p.email}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--portal-text-subtle)" }}
                        >
                          {p.street_address}, {p.suburb} {p.state}{" "}
                          {p.postcode}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        {p.credit_limit_cents > 0 && (
                          <p
                            className="text-[11px] font-mono"
                            style={{ color: "var(--portal-text-subtle)" }}
                          >
                            Credit: {formatCents(p.credit_limit_cents)}
                          </p>
                        )}
                        <p
                          className="text-[11px] mt-0.5 flex items-center gap-1 justify-end"
                          style={{ color: "var(--portal-text-subtle)" }}
                        >
                          <Clock className="w-3 h-3" />
                          {new Date(p.created_at).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
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
  tone: "info" | "success" | "warn" | "danger";
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
