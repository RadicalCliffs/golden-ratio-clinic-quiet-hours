import Link from "next/link";
import {
  Users,
  Calendar,
  Pill,
  ClipboardList,
  Clock,
  ArrowRight,
  AlertCircle,
  Mail,
  Phone,
  Video,
  CheckCircle2,
} from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import { ELIGIBILITY_LABELS } from "@/lib/database.types";

/**
 * Admin Home — the staff dashboard overview.
 *
 * This page is the first thing clinicians see when they sign in.
 * It answers three questions in one screen:
 *
 *   1. "What's my workload?" — stat tiles with counts
 *   2. "Who needs me first?" — pending eligibility review queue
 *   3. "What's happening today?" — today's appointments feed
 *
 * All data is fetched server-side in parallel. Counts use
 * `{ count: "exact", head: true }` which asks PostgREST for just
 * the tally without the row data — much cheaper for stat tiles.
 *
 * The page calls `requireStaff()` explicitly as defence in depth,
 * even though the parent layout already gates access. This survives
 * any future refactor that moves the page outside of the layout.
 */

// Force dynamic rendering — this page is user-specific and always
// fresh. Caching would leak stale stats between page loads.
export const dynamic = "force-dynamic";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Defence-in-depth — the layout already ran requireStaff(), but
  // calling it again here means the page still works if someone
  // later moves the file out of the admin route group.
  const session = await requireStaff();
  const params = await searchParams;

  const supabase = await createClient();

  // -------- Stat tile counts (parallel, count-only) ----------------
  // Each of these runs as a separate Postgres query via PostgREST.
  // `head: true` means "don't return row data, just the count" —
  // perfect for tile numbers.
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [
    patientCountRes,
    pendingReviewCountRes,
    appointmentsThisWeekRes,
    activePrescriptionCountRes,
    openEnquiriesCountRes,
  ] = await Promise.all([
    supabase
      .from("patient_profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("patient_profiles")
      .select("id", { count: "exact", head: true })
      .in("eligibility_status", ["pending", "under_review", "requires_followup"]),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", weekFromNow.toISOString())
      .not("status", "in", "(cancelled,completed,no_show)"),
    supabase
      .from("prescriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("contact_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  // -------- Queue data (parallel, row fetches with limits) ---------
  const [pendingReviewsRes, todaysApptsRes, recentEnquiriesRes] =
    await Promise.all([
      supabase
        .from("patient_profiles")
        .select("id, full_name, phone, state, eligibility_status, updated_at")
        .in("eligibility_status", ["pending", "under_review", "requires_followup"])
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("appointments")
        .select(
          "id, scheduled_at, appointment_type, contact_method, status, practitioner_name, user_id"
        )
        .gte("scheduled_at", startOfToday.toISOString())
        .lte("scheduled_at", endOfToday.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(20),
      supabase
        .from("contact_enquiries")
        .select("id, name, email, message, created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1"
          style={{ color: "var(--portal-text-subtle)" }}
        >
          Staff console
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold"
          style={{ color: "var(--portal-text)" }}
        >
          {greetingFor(session.fullName ?? session.email)}
        </h1>
        <p
          className="text-[14px] mt-1"
          style={{ color: "var(--portal-text-muted)" }}
        >
          Here&apos;s what&apos;s happening across the clinic today.
        </p>
        {params.error && (
          <div
            className="mt-4 flex items-start gap-2 p-3 rounded-xl text-[13px]"
            style={{
              background: "var(--portal-warning-soft)",
              color: "var(--portal-warning)",
              border: "1px solid var(--portal-warning)",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {params.error === "admin_required"
              ? "That action requires full admin privileges."
              : params.error === "role_required"
                ? "You don't have permission to access that page."
                : "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatTile
          label="Total patients"
          value={patientCountRes.count ?? 0}
          icon={Users}
          href="/portal/admin/patients"
        />
        <StatTile
          label="Pending review"
          value={pendingReviewCountRes.count ?? 0}
          icon={ClipboardList}
          tone="warn"
          href="/portal/admin/patients?filter=review"
        />
        <StatTile
          label="Appointments (7d)"
          value={appointmentsThisWeekRes.count ?? 0}
          icon={Calendar}
          href="/portal/admin/schedule"
        />
        <StatTile
          label="Active scripts"
          value={activePrescriptionCountRes.count ?? 0}
          icon={Pill}
          href="/portal/admin/scripts"
        />
        <StatTile
          label="New enquiries"
          value={openEnquiriesCountRes.count ?? 0}
          icon={Mail}
          tone="info"
          href="/portal/admin/inbox"
        />
      </div>

      {/* Two-column queues */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending eligibility review */}
        <Card
          title="Pending eligibility review"
          subtitle="Patients waiting for a clinical decision"
          action={{ label: "View all", href: "/portal/admin/patients?filter=review" }}
        >
          {pendingReviewsRes.data && pendingReviewsRes.data.length > 0 ? (
            <ul
              className="divide-y"
              style={{ borderColor: "var(--portal-border)" }}
            >
              {pendingReviewsRes.data.map((p) => (
                <li key={p.id} className="py-3">
                  <Link
                    href={`/portal/admin/patients/${p.id}`}
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-[14px] truncate"
                        style={{ color: "var(--portal-text)" }}
                      >
                        {p.full_name ?? "Unnamed patient"}
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "var(--portal-text-muted)" }}
                      >
                        {[p.state, p.phone].filter(Boolean).join(" · ") ||
                          "No contact details"}
                      </p>
                    </div>
                    <EligibilityBadge status={p.eligibility_status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              text="No patients awaiting review."
            />
          )}
        </Card>

        {/* Today's appointments */}
        <Card
          title="Today's appointments"
          subtitle={startOfToday.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          action={{ label: "Full schedule", href: "/portal/admin/schedule" }}
        >
          {todaysApptsRes.data && todaysApptsRes.data.length > 0 ? (
            <ul
              className="divide-y"
              style={{ borderColor: "var(--portal-border)" }}
            >
              {todaysApptsRes.data.map((a) => {
                const d = new Date(a.scheduled_at);
                const isVideo = a.contact_method === "video";
                return (
                  <li
                    key={a.id}
                    className="py-3 flex items-center gap-3"
                  >
                    <div
                      className="w-12 flex-shrink-0 text-center"
                      style={{ color: "var(--portal-text)" }}
                    >
                      <p className="text-[15px] font-bold leading-none">
                        {d.toLocaleTimeString("en-AU", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] font-semibold truncate"
                        style={{ color: "var(--portal-text)" }}
                      >
                        {humaniseApptType(a.appointment_type)}
                      </p>
                      <p
                        className="text-[11px] mt-0.5 flex items-center gap-2"
                        style={{ color: "var(--portal-text-muted)" }}
                      >
                        {isVideo ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <Phone className="w-3 h-3" />
                        )}
                        {a.practitioner_name ?? "Unassigned"}
                      </p>
                    </div>
                    <ApptStatusPill status={a.status} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={Clock} text="No appointments scheduled today." />
          )}
        </Card>
      </div>

      {/* New enquiries strip */}
      {recentEnquiriesRes.data && recentEnquiriesRes.data.length > 0 && (
        <Card
          title="New enquiries"
          subtitle="From the marketing contact form"
          action={{ label: "Inbox", href: "/portal/admin/inbox" }}
        >
          <ul
            className="divide-y"
            style={{ borderColor: "var(--portal-border)" }}
          >
            {recentEnquiriesRes.data.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--portal-text)" }}
                    >
                      {e.name}{" "}
                      <span
                        className="font-normal"
                        style={{ color: "var(--portal-text-subtle)" }}
                      >
                        · {e.email}
                      </span>
                    </p>
                    <p
                      className="text-[12px] mt-1 line-clamp-2"
                      style={{ color: "var(--portal-text-muted)" }}
                    >
                      {e.message}
                    </p>
                  </div>
                  <time
                    className="text-[11px] flex-shrink-0"
                    style={{ color: "var(--portal-text-subtle)" }}
                  >
                    {new Date(e.created_at ?? "").toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon: Icon,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  tone?: "neutral" | "warn" | "info";
}) {
  const toneBg: Record<string, string> = {
    neutral: "var(--portal-accent-soft)",
    warn: "var(--portal-warning-soft)",
    info: "var(--portal-info-soft)",
  };
  const toneFg: Record<string, string> = {
    neutral: "var(--portal-accent)",
    warn: "var(--portal-warning)",
    info: "var(--portal-info)",
  };

  const inner = (
    <div
      className="p-4 sm:p-5 rounded-2xl h-full transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--portal-surface)",
        border: "1px solid var(--portal-border)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: toneBg[tone], color: toneFg[tone] }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p
        className="text-2xl sm:text-3xl font-bold leading-none"
        style={{ color: "var(--portal-text)" }}
      >
        {value.toLocaleString("en-AU")}
      </p>
      <p
        className="text-[11px] sm:text-[12px] mt-1.5 font-medium"
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

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
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

function EligibilityBadge({ status }: { status: string }) {
  const config = ELIGIBILITY_LABELS[status] ?? {
    label: status,
    tone: "neutral" as const,
  };
  const toneColors: Record<string, { bg: string; fg: string }> = {
    neutral: {
      bg: "var(--portal-surface-2)",
      fg: "var(--portal-text-muted)",
    },
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
  const c = toneColors[config.tone];
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
      style={{ background: c.bg, color: c.fg }}
    >
      {config.label}
    </span>
  );
}

function ApptStatusPill({ status }: { status: string }) {
  const labels: Record<string, { label: string; tone: "success" | "info" | "warn" | "neutral" }> = {
    scheduled: { label: "Scheduled", tone: "info" },
    confirmed: { label: "Confirmed", tone: "success" },
    completed: { label: "Done", tone: "neutral" },
    cancelled: { label: "Cancelled", tone: "warn" },
    no_show: { label: "No-show", tone: "warn" },
    rescheduled: { label: "Rescheduled", tone: "info" },
  };
  const entry = labels[status] ?? { label: status, tone: "neutral" as const };
  const colors: Record<string, { bg: string; fg: string }> = {
    success: {
      bg: "var(--portal-accent-soft)",
      fg: "var(--portal-accent)",
    },
    info: {
      bg: "var(--portal-info-soft)",
      fg: "var(--portal-info)",
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
  const c = colors[entry.tone];
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      {entry.label}
    </span>
  );
}

// ─── Formatting helpers ──────────────────────────────────────────────

function greetingFor(name: string | null): string {
  const hour = new Date().getHours();
  const firstName = name?.split(/\s|@/)[0] ?? "there";
  const tod =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${tod}, ${firstName}`;
}

function humaniseApptType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
