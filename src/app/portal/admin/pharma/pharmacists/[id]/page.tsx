import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Building2,
  Hash,
  CreditCard,
  Info,
} from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import type {
  PharmacistProfile,
  Order,
} from "@/lib/pharma.types";
import {
  formatCents,
  VERIFICATION_LABELS,
  ORDER_STATUS_LABELS,
  ahpraRegisterUrl,
} from "@/lib/pharma.types";
import {
  approvePharmacist,
  rejectPharmacist,
  suspendPharmacist,
  reinstatePharmacist,
  updateCreditLimit,
} from "../actions";

/**
 * Pharmacist detail + verification actions.
 *
 * This is where an admin lives while reviewing an application.
 * Three panels:
 *
 *   1. Submitted details (AHPRA, pharmacy, address, phone) + a
 *      prominent "Check on AHPRA register" button that opens the
 *      public register in a new tab. This is the core manual
 *      verification step until we have PIE integration.
 *
 *   2. Action panel: approve / reject / suspend / reinstate depending
 *      on current state. Each button submits a server action.
 *
 *   3. Order history + credit facility summary.
 *
 * Notice messages flow through `?notice=approved|rejected|...`
 * query params so a server-action redirect can hydrate the banner.
 */

export const dynamic = "force-dynamic";

const NOTICE_LABELS: Record<string, { text: string; tone: "success" | "info" | "warn" }> = {
  approved: { text: "Pharmacist approved — they can now place orders.", tone: "success" },
  rejected: { text: "Application rejected.", tone: "warn" },
  suspended: { text: "Account suspended.", tone: "warn" },
  reinstated: { text: "Account reinstated.", tone: "success" },
  credit_updated: { text: "Credit limit updated.", tone: "info" },
};

const ERROR_LABELS: Record<string, string> = {
  reason_required: "A reason is required for rejection.",
};

export default async function PharmacistDetailPage({
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

  const { data: profile } = await supabase
    .from("pharma_pharmacist_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle<PharmacistProfile>();

  if (!profile) {
    notFound();
  }

  const { data: orders, count: orderCount } = await supabase
    .from("pharma_orders")
    .select("*", { count: "exact" })
    .eq("pharmacist_id", id)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<Order[]>();

  const lifetimeRevenue = (orders ?? []).reduce(
    (sum, o) => (o.status === "cancelled" ? sum : sum + o.total_cents),
    0
  );

  const statusMeta = VERIFICATION_LABELS[profile.verification_status];
  const creditRemaining =
    profile.credit_limit_cents - profile.credit_used_cents;

  const noticeMeta = notice ? NOTICE_LABELS[notice] : null;
  const errorMeta = error
    ? ERROR_LABELS[error] ?? decodeURIComponent(error)
    : null;

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div>
        <Link
          href="/portal/admin/pharma/pharmacists"
          className="inline-flex items-center gap-1.5 text-[12px] mb-4 transition-colors"
          style={{ color: "var(--portal-text-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All pharmacists
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1"
              style={{ color: "var(--portal-text-subtle)" }}
            >
              Pharmacy account
            </p>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--portal-text)" }}
            >
              {profile.pharmacy_name}
            </h1>
            <p
              className="text-[13px] font-mono mt-1"
              style={{ color: "var(--portal-text-muted)" }}
            >
              {profile.ahpra_number} · Submitted{" "}
              {new Date(profile.created_at).toLocaleDateString("en-AU")}
            </p>
          </div>
          <StatusPill label={statusMeta.label} tone={statusMeta.tone} big />
        </div>
      </div>

      {/* Notices */}
      {noticeMeta && (
        <Banner tone={noticeMeta.tone} icon={CheckCircle2}>
          {noticeMeta.text}
        </Banner>
      )}
      {errorMeta && (
        <Banner tone="warn" icon={AlertCircle}>
          {errorMeta}
        </Banner>
      )}

      {/* ─── Main grid ─── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left column — submitted details */}
        <div className="space-y-6">
          <Card title="Submitted details">
            <dl className="grid sm:grid-cols-2 gap-5 text-[13px]">
              <Field
                icon={Hash}
                label="AHPRA number"
                value={profile.ahpra_number}
                mono
              />
              <Field
                icon={Building2}
                label="Pharmacy"
                value={profile.pharmacy_name}
              />
              {profile.abn && (
                <Field icon={Hash} label="ABN" value={profile.abn} mono />
              )}
              <Field icon={Mail} label="Email" value={profile.email} />
              <Field
                icon={Phone}
                label="Phone"
                value={profile.phone}
                mono
              />
              <Field
                icon={MapPin}
                label="Address"
                value={`${profile.street_address}, ${profile.suburb} ${profile.state} ${profile.postcode}`}
                span
              />
            </dl>

            {/* AHPRA verification helper */}
            <div
              className="mt-6 p-4 rounded-xl flex items-start gap-3"
              style={{
                background: "var(--portal-accent-soft)",
                border: "1px solid var(--portal-border)",
              }}
            >
              <Info
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "var(--portal-accent)" }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-semibold mb-1"
                  style={{ color: "var(--portal-text)" }}
                >
                  Verify on AHPRA register
                </p>
                <p
                  className="text-[12px] leading-relaxed mb-3"
                  style={{ color: "var(--portal-text-muted)" }}
                >
                  Open the register in a new tab, paste the AHPRA
                  number{" "}
                  <span
                    className="font-mono font-bold"
                    style={{ color: "var(--portal-text)" }}
                  >
                    {profile.ahpra_number}
                  </span>{" "}
                  into the search field, and confirm the pharmacist&apos;s
                  name and principal place of practice match.
                </p>
                <a
                  href={ahpraRegisterUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-90"
                  style={{
                    background: "var(--portal-accent)",
                    color: "#fff",
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open AHPRA register
                </a>
              </div>
            </div>
          </Card>

          {/* Order history */}
          <Card
            title="Order history"
            subtitle={`${orderCount ?? 0} order${orderCount === 1 ? "" : "s"} · ${formatCents(lifetimeRevenue)} lifetime revenue`}
          >
            {orders && orders.length > 0 ? (
              <ul
                className="divide-y"
                style={{ borderColor: "var(--portal-border)" }}
              >
                {orders.map((o) => {
                  const meta = ORDER_STATUS_LABELS[o.status];
                  return (
                    <li key={o.id} className="py-3">
                      <Link
                        href={`/portal/admin/pharma/orders/${o.id}`}
                        className="flex items-center gap-3"
                      >
                        <p
                          className="text-[12px] font-mono font-semibold flex-shrink-0"
                          style={{ color: "var(--portal-text)" }}
                        >
                          #{o.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p
                          className="text-[11px] hidden sm:block"
                          style={{ color: "var(--portal-text-subtle)" }}
                        >
                          {new Date(o.created_at).toLocaleDateString("en-AU")}
                        </p>
                        <p
                          className="ml-auto text-[13px] font-mono font-bold tabular-nums"
                          style={{ color: "var(--portal-text)" }}
                        >
                          {formatCents(o.total_cents)}
                        </p>
                        <StatusPill
                          label={meta.label}
                          tone={meta.tone === "neutral" ? "info" : meta.tone}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p
                className="text-[13px] text-center py-6"
                style={{ color: "var(--portal-text-subtle)" }}
              >
                No orders yet.
              </p>
            )}
          </Card>
        </div>

        {/* Right column — actions + credit */}
        <aside className="space-y-4">
          {/* Verification actions */}
          <Card title="Verification">
            {profile.verification_status === "pending" && (
              <ApproveRejectActions profileId={profile.id} />
            )}
            {profile.verification_status === "active" && (
              <ActiveActions profileId={profile.id} />
            )}
            {profile.verification_status === "suspended" && (
              <SuspendedActions profileId={profile.id} />
            )}
            {profile.verification_status === "rejected" && (
              <RejectedActions profileId={profile.id} />
            )}
          </Card>

          {/* Credit facility */}
          {profile.verification_status === "active" && (
            <Card title="Credit facility">
              <div className="mb-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--portal-text-subtle)" }}
                >
                  Available
                </p>
                <p
                  className="text-2xl font-bold font-mono tabular-nums"
                  style={{ color: "var(--portal-text)" }}
                >
                  {formatCents(creditRemaining)}
                </p>
                <p
                  className="text-[11px] font-mono mt-1"
                  style={{ color: "var(--portal-text-subtle)" }}
                >
                  of {formatCents(profile.credit_limit_cents)} total
                </p>
              </div>
              <form action={updateCreditLimit} className="space-y-2">
                <input type="hidden" name="id" value={profile.id} />
                <label
                  className="block text-[11px] font-semibold"
                  style={{ color: "var(--portal-text-muted)" }}
                >
                  Set new limit (AUD)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="credit_limit_dollars"
                    min="0"
                    step="100"
                    defaultValue={(profile.credit_limit_cents / 100).toFixed(
                      0
                    )}
                    className="flex-1 px-3 py-2 rounded-lg text-[13px] font-mono"
                    style={{
                      background: "var(--portal-surface-2)",
                      color: "var(--portal-text)",
                      border: "1px solid var(--portal-border)",
                    }}
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg text-[12px] font-semibold"
                    style={{
                      background: "var(--portal-accent)",
                      color: "#fff",
                    }}
                  >
                    Update
                  </button>
                </div>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--portal-text-subtle)" }}
                >
                  Used: {formatCents(profile.credit_used_cents)}
                </p>
              </form>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Action panels ─────────────────────────────────────────────────

function ApproveRejectActions({ profileId }: { profileId: string }) {
  return (
    <div className="space-y-5">
      <p
        className="text-[12px] leading-relaxed"
        style={{ color: "var(--portal-text-muted)" }}
      >
        Check the AHPRA register before approving. Once approved, the
        pharmacy can place orders immediately.
      </p>

      {/* Approve form */}
      <form action={approvePharmacist} className="space-y-2">
        <input type="hidden" name="id" value={profileId} />
        <label
          className="block text-[11px] font-semibold"
          style={{ color: "var(--portal-text-muted)" }}
        >
          Initial credit limit (AUD, optional)
        </label>
        <input
          type="number"
          name="credit_limit_dollars"
          min="0"
          step="100"
          defaultValue="0"
          placeholder="0"
          className="w-full px-3 py-2 rounded-lg text-[13px] font-mono"
          style={{
            background: "var(--portal-surface-2)",
            color: "var(--portal-text)",
            border: "1px solid var(--portal-border)",
          }}
        />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-90"
          style={{ background: "var(--portal-accent)", color: "#fff" }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Approve pharmacist
        </button>
      </form>

      {/* Reject form */}
      <form
        action={rejectPharmacist}
        className="space-y-2 pt-4 border-t"
        style={{ borderColor: "var(--portal-border)" }}
      >
        <input type="hidden" name="id" value={profileId} />
        <label
          className="block text-[11px] font-semibold"
          style={{ color: "var(--portal-text-muted)" }}
        >
          Rejection reason
        </label>
        <textarea
          name="reason"
          required
          rows={2}
          placeholder="AHPRA number not found on register…"
          className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
          style={{
            background: "var(--portal-surface-2)",
            color: "var(--portal-text)",
            border: "1px solid var(--portal-border)",
          }}
        />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors"
          style={{
            background: "transparent",
            color: "var(--portal-danger)",
            border: "1px solid var(--portal-danger)",
          }}
        >
          Reject application
        </button>
      </form>
    </div>
  );
}

function ActiveActions({ profileId }: { profileId: string }) {
  return (
    <div className="space-y-3">
      <p
        className="text-[12px] leading-relaxed"
        style={{ color: "var(--portal-text-muted)" }}
      >
        This pharmacy is active and can place orders.
      </p>
      <form action={suspendPharmacist} className="space-y-2">
        <input type="hidden" name="id" value={profileId} />
        <input
          type="text"
          name="reason"
          placeholder="Reason (optional)"
          className="w-full px-3 py-2 rounded-lg text-[12px]"
          style={{
            background: "var(--portal-surface-2)",
            color: "var(--portal-text)",
            border: "1px solid var(--portal-border)",
          }}
        />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold"
          style={{
            background: "transparent",
            color: "var(--portal-warning)",
            border: "1px solid var(--portal-warning)",
          }}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Suspend account
        </button>
      </form>
    </div>
  );
}

function SuspendedActions({ profileId }: { profileId: string }) {
  return (
    <form action={reinstatePharmacist} className="space-y-3">
      <input type="hidden" name="id" value={profileId} />
      <p
        className="text-[12px] leading-relaxed"
        style={{ color: "var(--portal-text-muted)" }}
      >
        This account is currently suspended.
      </p>
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-90"
        style={{ background: "var(--portal-accent)", color: "#fff" }}
      >
        <RefreshCw className="w-4 h-4" />
        Reinstate account
      </button>
    </form>
  );
}

function RejectedActions({ profileId }: { profileId: string }) {
  return (
    <div className="space-y-3">
      <p
        className="text-[12px] leading-relaxed"
        style={{ color: "var(--portal-text-muted)" }}
      >
        Application was rejected. To reopen, the pharmacist must contact
        support. An admin can also re-approve manually below.
      </p>
      <form action={approvePharmacist}>
        <input type="hidden" name="id" value={profileId} />
        <input type="hidden" name="credit_limit_dollars" value="0" />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold"
          style={{
            background: "transparent",
            color: "var(--portal-accent)",
            border: "1px solid var(--portal-accent)",
          }}
        >
          Override — approve anyway
        </button>
      </form>
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
  icon: Icon,
  label,
  value,
  mono,
  span,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  mono?: boolean;
  span?: boolean;
}) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <dt
        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1"
        style={{ color: "var(--portal-text-subtle)" }}
      >
        <Icon className="w-3 h-3" />
        {label}
      </dt>
      <dd
        className={mono ? "font-mono" : ""}
        style={{ color: "var(--portal-text)" }}
      >
        {value}
      </dd>
    </div>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "success" | "info" | "warn";
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  const toneColors: Record<string, { bg: string; fg: string; border: string }> = {
    success: {
      bg: "var(--portal-accent-soft)",
      fg: "var(--portal-accent)",
      border: "var(--portal-accent)",
    },
    info: {
      bg: "var(--portal-info-soft)",
      fg: "var(--portal-info)",
      border: "var(--portal-info)",
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
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
      }}
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

function StatusPill({
  label,
  tone,
  big,
}: {
  label: string;
  tone: "info" | "success" | "warn" | "danger";
  big?: boolean;
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
      className={`font-bold uppercase tracking-wider rounded-full whitespace-nowrap ${big ? "text-[11px] px-3 py-1" : "text-[9px] px-2 py-0.5"}`}
      style={{ background: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}
