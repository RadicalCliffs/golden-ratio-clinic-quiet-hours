"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Pill,
  MessageSquare,
  FileText,
  Phone,
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  LogOut,
  Plus,
  RefreshCw,
  Loader2,
  User as UserIcon,
  ShieldCheck,
  X,
  Sparkles,
  Upload,
  Trash2,
  Download,
  Paperclip,
  CalendarPlus,
} from "lucide-react";
import { useTheme } from "../theme-provider";
import { ELIGIBILITY_LABELS } from "@/lib/database.types";
import type {
  PatientProfile,
  Appointment,
  Prescription,
} from "@/lib/database.types";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  yahooCalendarUrl,
} from "@/lib/ics";

/**
 * Patient Dashboard — client-side interactive shell
 *
 * Server component fetches initial auth + profile and passes them
 * here. This component then hits the /api/portal/* endpoints to
 * load live data and handle booking/refill/messaging interactions.
 *
 * All UI uses CSS variables (--portal-*) so the theme toggle flips
 * light/dark instantly without re-fetching data.
 */
export default function DashboardClient({
  userId,
  userEmail,
  userFullName,
  isStaff = false,
}: {
  userId: string;
  userEmail: string;
  userFullName: string | null;
  /**
   * True if the authenticated user holds any clinic role (admin /
   * nurse / doctor). When true, a "Staff console" link is rendered
   * in the top bar that navigates to /portal/admin. The admin panel
   * itself re-authorises server-side, so this prop only controls
   * visibility — it's not a security boundary.
   */
  isStaff?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isMockData, setIsMockData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "err" } | null>(
    null
  );

  const showToast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, apptRes, rxRes] = await Promise.all([
        fetch("/api/portal/profile").then((r) => r.json()),
        fetch("/api/portal/appointments").then((r) => r.json()),
        fetch("/api/portal/prescriptions").then((r) => r.json()),
      ]);
      setProfile(profileRes.profile);
      setAppointments(apptRes.appointments ?? []);
      setPrescriptions(rxRes.prescriptions ?? []);
      setIsMockData(
        Boolean(apptRes.is_mock || rxRes.is_mock || profileRes.profile?.is_mock)
      );
    } catch (err) {
      console.error("portal load failed", err);
      showToast("Couldn't load your data. Please refresh.", "err");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  // Derived data
  const now = Date.now();
  const upcomingAppts = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            new Date(a.scheduled_at).getTime() >= now &&
            !["cancelled", "completed"].includes(a.status)
        )
        .slice(0, 3),
    [appointments, now]
  );
  const pastAppts = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            new Date(a.scheduled_at).getTime() < now ||
            ["completed", "cancelled"].includes(a.status)
        )
        .slice(0, 5),
    [appointments, now]
  );
  const activeRx = useMemo(
    () =>
      prescriptions.filter((p) => ["active", "dispensed"].includes(p.status)),
    [prescriptions]
  );

  const eligibility = profile?.eligibility_status ?? "pending";
  const eligibilityMeta = ELIGIBILITY_LABELS[eligibility];
  const greeting =
    profile?.preferred_name ??
    profile?.full_name?.split(" ")[0] ??
    userFullName?.split(" ")[0] ??
    userEmail.split("@")[0];

  return (
    <div
      style={{
        background: "var(--portal-bg)",
        color: "var(--portal-text)",
        minHeight: "100vh",
        fontFamily: "var(--font-body-text), system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--portal-bg) 85%, transparent)",
          borderBottom: "1px solid var(--portal-border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/portal/dashboard" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--portal-text)" }}
            >
              <span
                className="font-serif italic text-base"
                style={{ color: "var(--portal-highlight)" }}
              >
                φ
              </span>
            </div>
            <div>
              <p
                className="font-serif text-[16px] font-semibold leading-none"
                style={{ color: "var(--portal-text)" }}
              >
                Golden Ratio <span className="italic font-normal">Clinics</span>
              </p>
              <p
                className="text-[10px] uppercase tracking-[0.18em] mt-0.5"
                style={{ color: "var(--portal-text-subtle)" }}
              >
                Patient Portal
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            {/* Staff console — only visible to users with a clinic
                role. Server-side authorisation re-checks on the
                target page via requireStaff() in the layout. */}
            {isStaff && (
              <Link
                href="/portal/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold transition-colors"
                style={{
                  background: "var(--portal-accent-soft)",
                  color: "var(--portal-accent)",
                  border: "1px solid var(--portal-accent-soft)",
                }}
                title="Switch to the staff console"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Staff console
              </Link>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full transition-colors"
              style={{ color: "var(--portal-text-muted)" }}
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-colors"
              style={{ color: "var(--portal-text-muted)" }}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-colors"
                style={{
                  border: "1px solid var(--portal-border)",
                  color: "var(--portal-text-muted)",
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome header */}
        <div className="mb-8">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--portal-accent)" }}
          >
            Dashboard
          </p>
          <h1
            className="font-serif text-4xl lg:text-5xl font-semibold leading-tight"
            style={{ color: "var(--portal-text)" }}
          >
            Hello,{" "}
            <span
              className="italic"
              style={{ color: "var(--portal-accent)" }}
            >
              {greeting}
            </span>
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: "var(--portal-text-muted)" }}>
            Everything you need from your care team in one place.
          </p>
        </div>

        {/* Sample data notice */}
        {isMockData && !loading && (
          <div
            className="mb-6 flex items-start gap-3 p-4 rounded-2xl"
            style={{
              background: "var(--portal-info-soft)",
              border: "1px solid var(--portal-border)",
            }}
          >
            <Sparkles
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: "var(--portal-info)" }}
            />
            <div className="flex-1 text-[13px]">
              <p
                className="font-semibold"
                style={{ color: "var(--portal-text)" }}
              >
                Sample data
              </p>
              <p
                className="mt-0.5"
                style={{ color: "var(--portal-text-muted)" }}
              >
                We&rsquo;re showing example appointments and prescriptions until
                your real records appear. These are filled in automatically by
                our clinical team after your consultation.
              </p>
            </div>
          </div>
        )}

        {/* Eligibility banner */}
        <EligibilityBanner
          status={eligibility}
          label={eligibilityMeta?.label ?? eligibility}
          tone={eligibilityMeta?.tone ?? "neutral"}
        />

        {/* Main grid — next appointment (big) + profile (small) */}
        <div className="grid lg:grid-cols-3 gap-5 mt-8">
          <Card className="lg:col-span-2">
            <CardHeader
              eyebrow="Upcoming"
              title="Your next appointment"
              icon={Calendar}
              action={
                <button
                  onClick={() => setBookingOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all"
                  style={{
                    background: "var(--portal-text)",
                    color: "var(--portal-bg)",
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Book appointment
                </button>
              }
            />
            {loading ? (
              <LoadingRows count={2} />
            ) : upcomingAppts.length === 0 ? (
              <EmptyState
                text="You have no upcoming appointments scheduled."
                action={
                  <button
                    onClick={() => setBookingOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold mt-4"
                    style={{
                      background: "var(--portal-accent)",
                      color: "var(--portal-bg)",
                    }}
                  >
                    Book directly with a nurse
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
            ) : (
              <div className="space-y-3 mt-4">
                {upcomingAppts.map((appt) => (
                  <AppointmentRow key={appt.id} appointment={appt} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader eyebrow="Account" title="Your profile" icon={UserIcon} />
            {loading ? (
              <LoadingRows count={4} />
            ) : (
              <>
                <AvatarUploader
                  currentUrl={profile?.avatar_url ?? null}
                  fullName={profile?.full_name ?? userFullName}
                  onChange={(url) => {
                    setProfile((prev) =>
                      prev ? { ...prev, avatar_url: url } : prev
                    );
                  }}
                  onToast={showToast}
                />
                <dl className="space-y-3 mt-4 text-[13px]">
                  <Field label="Email" value={userEmail} />
                  <Field
                    label="Name"
                    value={profile?.full_name ?? userFullName ?? "Not set"}
                  />
                  <Field label="Phone" value={profile?.phone ?? "Not set"} />
                  <Field label="State" value={profile?.state ?? "Not set"} />
                </dl>
              </>
            )}
          </Card>

          {/* Active prescriptions (wide) */}
          <Card className="lg:col-span-2">
            <CardHeader
              eyebrow="Treatment"
              title="Active prescriptions"
              icon={Pill}
            />
            {loading ? (
              <LoadingRows count={2} />
            ) : activeRx.length === 0 ? (
              <EmptyState
                text={
                  eligibility === "approved"
                    ? "No active prescriptions on file yet."
                    : "Prescriptions are issued only after a clinical consultation."
                }
              />
            ) : (
              <div className="space-y-3 mt-4">
                {activeRx.map((rx) => (
                  <PrescriptionRow
                    key={rx.id}
                    prescription={rx}
                    onRequestRefill={async () => {
                      try {
                        const res = await fetch("/api/portal/request-refill", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ prescription_id: rx.id }),
                        });
                        if (!res.ok) throw new Error("refill_failed");
                        showToast(
                          "Refill request submitted. Your doctor will review it shortly.",
                          "ok"
                        );
                        loadAll();
                      } catch {
                        showToast(
                          "Couldn't submit refill request. Try again.",
                          "err"
                        );
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader
              eyebrow="Actions"
              title="Quick actions"
              icon={Sparkles}
            />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <QuickActionButton
                icon={Calendar}
                label="Book"
                onClick={() => setBookingOpen(true)}
              />
              <QuickActionButton
                icon={MessageSquare}
                label="Message team"
                onClick={() => setMessageOpen(true)}
              />
              <QuickActionButton
                icon={Pill}
                label="Request refill"
                onClick={async () => {
                  if (activeRx.length === 0) {
                    showToast(
                      "No active prescription to refill.",
                      "err"
                    );
                    return;
                  }
                  try {
                    const res = await fetch("/api/portal/request-refill", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        prescription_id: activeRx[0]?.id,
                      }),
                    });
                    if (!res.ok) throw new Error();
                    showToast("Refill request submitted.", "ok");
                    loadAll();
                  } catch {
                    showToast("Couldn't request refill.", "err");
                  }
                }}
              />
              <QuickActionButton
                icon={FileText}
                label="Records"
                onClick={() => setRecordsOpen(true)}
              />
            </div>
          </Card>

          {/* Recent activity */}
          <Card className="lg:col-span-3">
            <CardHeader
              eyebrow="History"
              title="Recent activity"
              icon={Clock}
            />
            {loading ? (
              <LoadingRows count={3} />
            ) : pastAppts.length === 0 ? (
              <EmptyState text="No past appointments yet." />
            ) : (
              <ul className="mt-4 divide-y" style={{ borderColor: "var(--portal-border)" }}>
                {pastAppts.map((appt) => (
                  <li
                    key={appt.id}
                    className="flex items-center justify-between py-3"
                    style={{ borderColor: "var(--portal-border)" }}
                  >
                    <div>
                      <p
                        className="font-semibold text-[14px]"
                        style={{ color: "var(--portal-text)" }}
                      >
                        {humanAppointmentType(appt.appointment_type)}
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "var(--portal-text-subtle)" }}
                      >
                        {formatDate(appt.scheduled_at)} ·{" "}
                        {appt.practitioner_name ?? "Clinical team"}
                      </p>
                    </div>
                    <StatusPill status={appt.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Privacy footer */}
        <div
          className="mt-10 p-5 rounded-2xl flex items-start gap-3 text-[12px] leading-relaxed"
          style={{
            background: "var(--portal-surface-2)",
            border: "1px solid var(--portal-border)",
            color: "var(--portal-text-muted)",
          }}
        >
          <ShieldCheck
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "var(--portal-accent)" }}
          />
          <p>
            <strong style={{ color: "var(--portal-text)" }}>
              Your data is protected.
            </strong>{" "}
            All clinical information is held in a database with
            row-level security — only you can see your own records. Our
            team accesses your data through audited admin tools. Golden
            Ratio Clinics operates in accordance with the Australian
            Privacy Principles and Ahpra prescribing guidance.
          </p>
        </div>
      </main>

      {/* Booking modal */}
      {bookingOpen && (
        <BookingModal
          onClose={() => setBookingOpen(false)}
          onSuccess={() => {
            setBookingOpen(false);
            showToast(
              "Appointment requested. A nurse will confirm shortly.",
              "ok"
            );
            loadAll();
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}

      {/* Message modal */}
      {messageOpen && (
        <MessageModal
          onClose={() => setMessageOpen(false)}
          onSuccess={() => {
            setMessageOpen(false);
            showToast(
              "Message sent. Your care team will respond within one business day.",
              "ok"
            );
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}

      {/* Medical records modal */}
      {recordsOpen && (
        <RecordsModal
          onClose={() => setRecordsOpen(false)}
          onToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-[13px] font-medium shadow-lg flex items-center gap-2 z-50"
          style={{
            background:
              toast.kind === "ok"
                ? "var(--portal-accent)"
                : "var(--portal-danger)",
            color: "#fff",
          }}
        >
          {toast.kind === "ok" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.text}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl p-6 lg:p-7 ${className}`}
      style={{
        background: "var(--portal-surface)",
        border: "1px solid var(--portal-border)",
        boxShadow: "var(--portal-shadow)",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  eyebrow,
  title,
  icon: Icon,
  action,
}: {
  eyebrow: string;
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--portal-accent-soft)" }}
        >
          <Icon className="w-4 h-4" style={{ color: "var(--portal-accent)" }} />
        </div>
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5"
            style={{ color: "var(--portal-text-subtle)" }}
          >
            {eyebrow}
          </p>
          <h2
            className="font-serif text-xl font-semibold leading-tight"
            style={{ color: "var(--portal-text)" }}
          >
            {title}
          </h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function EligibilityBanner({
  label,
  tone,
  status,
}: {
  label: string;
  tone: "neutral" | "info" | "success" | "warn" | "danger";
  status: string;
}) {
  const toneMap: Record<
    typeof tone,
    { bg: string; text: string; icon: React.ElementType }
  > = {
    success: {
      bg: "var(--portal-accent-soft)",
      text: "var(--portal-accent)",
      icon: CheckCircle,
    },
    info: {
      bg: "var(--portal-info-soft)",
      text: "var(--portal-info)",
      icon: Clock,
    },
    warn: {
      bg: "var(--portal-warning-soft)",
      text: "var(--portal-warning)",
      icon: AlertCircle,
    },
    danger: {
      bg: "var(--portal-danger-soft)",
      text: "var(--portal-danger)",
      icon: AlertCircle,
    },
    neutral: {
      bg: "var(--portal-surface-2)",
      text: "var(--portal-text-muted)",
      icon: Clock,
    },
  };
  const t = toneMap[tone];
  const Icon = t.icon;

  const descriptions: Record<string, string> = {
    pending:
      "We're waiting to receive your pre-screening call. Once that's complete, our nursing team will review your file.",
    under_review:
      "Your file is currently with our clinical team for review.",
    approved:
      "You're approved as a patient. Book a consultation below whenever you need one.",
    requires_followup:
      "Our team needs a little more information — check your email or phone.",
    declined:
      "Our service may not be the right fit right now. Your regular GP is a good next step.",
  };

  return (
    <div
      className="rounded-3xl p-5 lg:p-6 flex items-start gap-4"
      style={{
        background: "var(--portal-surface)",
        border: "1px solid var(--portal-border)",
      }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: t.bg }}
      >
        <Icon className="w-5 h-5" style={{ color: t.text }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1"
          style={{ color: "var(--portal-text-subtle)" }}
        >
          Eligibility status
        </p>
        <h2
          className="font-serif text-xl lg:text-2xl font-semibold mb-1"
          style={{ color: "var(--portal-text)" }}
        >
          {label}
        </h2>
        <p className="text-[13px]" style={{ color: "var(--portal-text-muted)" }}>
          {descriptions[status] ?? descriptions.pending}
        </p>
      </div>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const date = new Date(appointment.scheduled_at);
  const isVideo = appointment.contact_method === "video";
  // Only show "Add to calendar" for upcoming, non-cancelled appointments.
  // No point adding a past completed visit to the user's calendar.
  const isUpcoming =
    date.getTime() > Date.now() &&
    !["cancelled", "completed", "no_show"].includes(appointment.status);
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{
        background: "var(--portal-surface-2)",
        border: "1px solid var(--portal-border)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: "var(--portal-surface)" }}
      >
        <span
          className="text-[9px] font-bold uppercase"
          style={{ color: "var(--portal-text-subtle)" }}
        >
          {date.toLocaleDateString("en-AU", { month: "short" })}
        </span>
        <span
          className="text-base font-bold -mt-1"
          style={{ color: "var(--portal-text)" }}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-[14px]"
          style={{ color: "var(--portal-text)" }}
        >
          {humanAppointmentType(appointment.appointment_type)}
        </p>
        <p
          className="text-[12px] mt-0.5 flex items-center gap-3 flex-wrap"
          style={{ color: "var(--portal-text-muted)" }}
        >
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {date.toLocaleTimeString("en-AU", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <span className="flex items-center gap-1">
            {isVideo ? (
              <Video className="w-3 h-3" />
            ) : (
              <Phone className="w-3 h-3" />
            )}
            {isVideo ? "Video" : "Phone"}
          </span>
          {appointment.practitioner_name && (
            <span>· {appointment.practitioner_name}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isUpcoming && <AddToCalendarDropdown appointment={appointment} />}
        <StatusPill status={appointment.status} />
      </div>
    </div>
  );
}

/**
 * AddToCalendarDropdown — one-click "Add to calendar" menu.
 *
 * Offers three destinations:
 *
 *  1. **Google Calendar** — opens `calendar.google.com/render` with
 *     the event pre-filled. No OAuth needed; Google auto-authenticates
 *     the user with whatever Google session is already active.
 *  2. **Outlook / Office 365** — same pattern via the `outlook.live.com`
 *     deeplink compose endpoint.
 *  3. **Apple Calendar / other (.ics download)** — downloads an RFC
 *     5545 file from our own API. macOS and iOS will open the .ics in
 *     Apple Calendar by default; Windows and Linux will prompt the
 *     user to pick their preferred calendar app. The file is
 *     authenticated via the user's session cookie and scoped to a
 *     single appointment row that RLS guarantees they own.
 *
 * Why Google/Outlook are web intents (URL-based) and Apple is ICS:
 * Apple doesn't publish a web-intent URL for Calendar, but every Mac
 * and iPhone natively handles the `text/calendar` MIME, so the ICS
 * download is effectively the Apple integration. Bundling a download
 * link alongside the web intents also covers every other client
 * (Thunderbird, Fastmail, Proton Calendar, etc.) without us having
 * to ship per-vendor URL schemes.
 */
function AddToCalendarDropdown({
  appointment,
}: {
  appointment: Appointment;
}) {
  const [open, setOpen] = useState(false);

  // Derive the event metadata once per render. Memoising isn't worth
  // it — these are all primitive ops.
  const start = new Date(appointment.scheduled_at);
  const end = new Date(
    start.getTime() + (appointment.duration_minutes ?? 15) * 60 * 1000
  );
  const title = `Golden Ratio Clinics · ${humanAppointmentType(
    appointment.appointment_type
  )}`;
  const isVideo = appointment.contact_method === "video";
  const location = isVideo
    ? "Video consultation (link emailed before appointment)"
    : "Phone consultation";
  const description = [
    `Appointment: ${humanAppointmentType(appointment.appointment_type)}`,
    `Contact method: ${isVideo ? "Video call" : "Phone call"}`,
    appointment.practitioner_name
      ? `Practitioner: ${appointment.practitioner_name}`
      : null,
    `Duration: ${appointment.duration_minutes ?? 15} minutes`,
    "",
    "Need to reschedule? Sign in at https://goldenratioclinics.com.au/portal/dashboard",
  ]
    .filter(Boolean)
    .join("\n");

  const webIntent = { title, start, end, description, location };
  const googleUrl = googleCalendarUrl(webIntent);
  const outlookUrl = outlookCalendarUrl(webIntent);
  const yahooUrl = yahooCalendarUrl(webIntent);
  const icsUrl = `/api/portal/appointments/${appointment.id}/calendar.ics`;

  return (
    <div
      className="relative"
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors"
        style={{
          background: "var(--portal-surface)",
          color: "var(--portal-text-muted)",
          border: "1px solid var(--portal-border)",
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <CalendarPlus className="w-3 h-3" />
        <span className="hidden sm:inline">Add to calendar</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-52 rounded-xl overflow-hidden z-20 shadow-lg"
          style={{
            background: "var(--portal-surface)",
            border: "1px solid var(--portal-border)",
          }}
        >
          <CalendarMenuItem
            href={googleUrl}
            label="Google Calendar"
            external
          />
          <CalendarMenuItem
            href={outlookUrl}
            label="Outlook"
            external
          />
          <CalendarMenuItem
            href={yahooUrl}
            label="Yahoo Calendar"
            external
          />
          <CalendarMenuItem
            href={icsUrl}
            label="Apple / Other (.ics)"
            download
          />
        </div>
      )}
    </div>
  );
}

function CalendarMenuItem({
  href,
  label,
  external,
  download,
}: {
  href: string;
  label: string;
  external?: boolean;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      download={download ? "" : undefined}
      className="block px-4 py-2.5 text-[13px] font-medium transition-colors hover:opacity-80"
      style={{ color: "var(--portal-text)" }}
      role="menuitem"
    >
      {label}
    </a>
  );
}

function PrescriptionRow({
  prescription,
  onRequestRefill,
}: {
  prescription: Prescription;
  onRequestRefill: () => void;
}) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-2xl"
      style={{
        background: "var(--portal-surface-2)",
        border: "1px solid var(--portal-border)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--portal-surface)" }}
      >
        <Pill className="w-4 h-4" style={{ color: "var(--portal-accent)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className="font-semibold text-[14px]"
            style={{ color: "var(--portal-text)" }}
          >
            Prescription{" "}
            {prescription.prescription_reference ??
              `#${prescription.id.slice(0, 8)}`}
          </p>
          <StatusPill status={prescription.status} />
        </div>
        <p
          className="text-[12px] mt-1"
          style={{ color: "var(--portal-text-muted)" }}
        >
          {prescription.prescribing_doctor && (
            <span>{prescription.prescribing_doctor} · </span>
          )}
          {prescription.issued_date && (
            <span>Issued {formatDate(prescription.issued_date)}</span>
          )}
          {prescription.next_review_date && (
            <span> · Review {formatDate(prescription.next_review_date)}</span>
          )}
        </p>
        {prescription.patient_visible_notes && (
          <p
            className="text-[12px] mt-2 italic"
            style={{ color: "var(--portal-text-subtle)" }}
          >
            {prescription.patient_visible_notes}
          </p>
        )}
        <button
          onClick={onRequestRefill}
          className="mt-3 text-[12px] font-semibold flex items-center gap-1.5"
          style={{ color: "var(--portal-accent)" }}
        >
          <RefreshCw className="w-3 h-3" />
          Request refill
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    scheduled: { bg: "var(--portal-info-soft)", text: "var(--portal-info)" },
    confirmed: {
      bg: "var(--portal-accent-soft)",
      text: "var(--portal-accent)",
    },
    completed: {
      bg: "var(--portal-surface-2)",
      text: "var(--portal-text-muted)",
    },
    cancelled: {
      bg: "var(--portal-danger-soft)",
      text: "var(--portal-danger)",
    },
    no_show: {
      bg: "var(--portal-danger-soft)",
      text: "var(--portal-danger)",
    },
    rescheduled: {
      bg: "var(--portal-warning-soft)",
      text: "var(--portal-warning)",
    },
    active: { bg: "var(--portal-accent-soft)", text: "var(--portal-accent)" },
    dispensed: { bg: "var(--portal-info-soft)", text: "var(--portal-info)" },
    pending: {
      bg: "var(--portal-surface-2)",
      text: "var(--portal-text-muted)",
    },
    expired: {
      bg: "var(--portal-danger-soft)",
      text: "var(--portal-danger)",
    },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt
        className="text-[10px] uppercase tracking-wider"
        style={{ color: "var(--portal-text-subtle)" }}
      >
        {label}
      </dt>
      <dd
        className="font-medium text-right truncate max-w-[60%]"
        style={{ color: "var(--portal-text)" }}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * AvatarUploader — click-to-upload profile picture tile.
 *
 * Renders either the current avatar or the user's initials, and on
 * click opens a file picker. Uploaded files go through
 * /api/portal/avatar which writes to the PUBLIC `avatars` bucket at
 * the stable path `<user.id>/avatar.<ext>` and persists the URL on
 * patient_profiles.avatar_url.
 *
 * Why not just read from the bucket directly from the client? Because
 * the path depends on the extension, and we don't want the UI to have
 * to list the bucket on every render. Storing the full URL (with a
 * cache-bust query string) on the profile row makes reads O(1).
 */
function AvatarUploader({
  currentUrl,
  fullName,
  onChange,
  onToast,
}: {
  currentUrl: string | null;
  fullName: string | null | undefined;
  onChange: (url: string | null) => void;
  onToast: (text: string, kind?: "ok" | "err") => void;
}) {
  const [uploading, setUploading] = useState(false);

  const initials = useMemo(() => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  }, [fullName]);

  const handleFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      onToast("Image is too large (max 2 MB).", "err");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      onToast("Please use a JPG, PNG or WebP image.", "err");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/portal/avatar", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "upload_failed");
      onChange(json.avatar_url);
      onToast("Profile picture updated.", "ok");
    } catch {
      onToast("Upload failed. Please try again.", "err");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-5">
      <label className="relative group cursor-pointer flex-shrink-0">
        <input
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              handleFile(f);
              e.target.value = "";
            }
          }}
        />
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden text-lg font-bold transition-opacity group-hover:opacity-80"
          style={{
            background: currentUrl
              ? "transparent"
              : "var(--portal-accent-soft)",
            color: "var(--portal-accent)",
            border: "2px solid var(--portal-border)",
          }}
        >
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span style={{ color: "var(--portal-accent)" }}>
              {initials.toUpperCase()}
            </span>
          )}
        </div>
        {uploading ? (
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        ) : (
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "var(--portal-accent)",
              color: "#fff",
              border: "2px solid var(--portal-surface)",
            }}
          >
            <Upload className="w-3 h-3" />
          </div>
        )}
      </label>
      <div className="min-w-0">
        <p
          className="text-[13px] font-semibold truncate"
          style={{ color: "var(--portal-text)" }}
        >
          {fullName ?? "Welcome"}
        </p>
        <p
          className="text-[11px]"
          style={{ color: "var(--portal-text-subtle)" }}
        >
          Click photo to change · 2 MB max
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  text,
  action,
}: {
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-8">
      <p
        className="text-[13px] max-w-sm mx-auto leading-relaxed"
        style={{ color: "var(--portal-text-muted)" }}
      >
        {text}
      </p>
      {action}
    </div>
  );
}

function LoadingRows({ count }: { count: number }) {
  return (
    <div className="space-y-3 mt-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-2xl animate-pulse"
          style={{ background: "var(--portal-surface-2)" }}
        />
      ))}
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl transition-colors text-center"
      style={{
        background: "var(--portal-surface-2)",
        border: "1px solid var(--portal-border)",
      }}
    >
      <Icon className="w-5 h-5" style={{ color: "var(--portal-accent)" }} />
      <span
        className="text-[11px] font-semibold"
        style={{ color: "var(--portal-text)" }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Modals ───────────────────────────────────────────────────────

function BookingModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/portal/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_date: fd.get("date"),
          preferred_time: fd.get("time"),
          contact_method: fd.get("contact_method"),
          appointment_type: fd.get("appointment_type"),
          notes: fd.get("notes"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "booking_failed");
      }
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't book appointment");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Book an appointment" onClose={onClose}>
      <p
        className="text-[13px] mb-5"
        style={{ color: "var(--portal-text-muted)" }}
      >
        You&rsquo;re already a verified patient, so this goes direct to our
        nurse team for confirmation — no pre-screening needed.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: "var(--portal-text-muted)" }}
            >
              Date
            </span>
            <input
              type="date"
              name="date"
              required
              min={minDate}
              className="w-full px-3 py-2.5 rounded-xl text-[14px]"
              style={{
                background: "var(--portal-surface-2)",
                border: "1px solid var(--portal-border)",
                color: "var(--portal-text)",
              }}
            />
          </label>
          <label className="block">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: "var(--portal-text-muted)" }}
            >
              Time
            </span>
            <input
              type="time"
              name="time"
              required
              defaultValue="10:00"
              className="w-full px-3 py-2.5 rounded-xl text-[14px]"
              style={{
                background: "var(--portal-surface-2)",
                border: "1px solid var(--portal-border)",
                color: "var(--portal-text)",
              }}
            />
          </label>
        </div>
        <label className="block">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: "var(--portal-text-muted)" }}
          >
            Appointment type
          </span>
          <select
            name="appointment_type"
            defaultValue="follow_up"
            className="w-full px-3 py-2.5 rounded-xl text-[14px]"
            style={{
              background: "var(--portal-surface-2)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text)",
            }}
          >
            <option value="follow_up">Follow-up appointment</option>
            <option value="review">Clinical review</option>
            <option value="initial_consultation">Initial consultation</option>
          </select>
        </label>
        <label className="block">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: "var(--portal-text-muted)" }}
          >
            Contact method
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "phone", l: "Phone", Icon: Phone },
              { v: "video", l: "Video", Icon: Video },
            ].map(({ v, l, Icon }) => (
              <label
                key={v}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer"
                style={{
                  background: "var(--portal-surface-2)",
                  border: "1px solid var(--portal-border)",
                }}
              >
                <input
                  type="radio"
                  name="contact_method"
                  value={v}
                  defaultChecked={v === "phone"}
                  className="sr-only peer"
                />
                <Icon className="w-4 h-4" style={{ color: "var(--portal-accent)" }} />
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--portal-text)" }}
                >
                  {l}
                </span>
              </label>
            ))}
          </div>
        </label>
        <label className="block">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: "var(--portal-text-muted)" }}
          >
            Notes (optional)
          </span>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] resize-none"
            placeholder="Anything the nurse team should know?"
            style={{
              background: "var(--portal-surface-2)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text)",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: "var(--portal-text)",
            color: "var(--portal-bg)",
          }}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Submitting..." : "Request appointment"}
        </button>
      </form>
    </ModalShell>
  );
}

function MessageModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: fd.get("subject"),
          message: fd.get("message"),
        }),
      });
      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      onError("Couldn't send message. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Message your care team" onClose={onClose}>
      <p
        className="text-[13px] mb-5"
        style={{ color: "var(--portal-text-muted)" }}
      >
        Non-urgent clinical questions — your nurse will respond within one
        business day. For emergencies call 000.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: "var(--portal-text-muted)" }}
          >
            Subject (optional)
          </span>
          <input
            type="text"
            name="subject"
            placeholder="e.g. Question about medication timing"
            className="w-full px-3 py-2.5 rounded-xl text-[14px]"
            style={{
              background: "var(--portal-surface-2)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text)",
            }}
          />
        </label>
        <label className="block">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
            style={{ color: "var(--portal-text-muted)" }}
          >
            Message
          </span>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="Your message..."
            className="w-full px-3 py-2.5 rounded-xl text-[14px] resize-none"
            style={{
              background: "var(--portal-surface-2)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text)",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: "var(--portal-text)",
            color: "var(--portal-bg)",
          }}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Sending..." : "Send message"}
        </button>
      </form>
    </ModalShell>
  );
}

/**
 * Medical records modal — lists the user's uploaded files from the
 * private `medical-records` bucket, supports upload + delete.
 *
 * Files are uploaded via multipart POST to /api/portal/records. The
 * server scopes every path to `<user.id>/...` and never trusts client
 * input for the folder. Each listed file carries a 5-minute signed URL
 * for viewing.
 */
type MedicalFile = {
  name: string;
  path: string;
  size: number | null;
  mime: string | null;
  created_at: string;
  url: string | null;
};

function RecordsModal({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast: (text: string, kind?: "ok" | "err") => void;
}) {
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/records");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "load_failed");
      setFiles(json.files ?? []);
    } catch {
      onToast("Couldn't load your records.", "err");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      onToast("File is too large (max 20 MB).", "err");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/portal/records", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "upload_failed");
      onToast("File uploaded securely.", "ok");
      await load();
    } catch (err) {
      onToast(
        err instanceof Error && err.message === "file_too_large"
          ? "File is too large (max 20 MB)."
          : "Upload failed. Please try again.",
        "err"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (f: MedicalFile) => {
    if (!confirm(`Delete "${f.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(
        `/api/portal/records?name=${encodeURIComponent(f.path)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      onToast("File deleted.", "ok");
      setFiles((prev) => prev.filter((x) => x.path !== f.path));
    } catch {
      onToast("Couldn't delete that file.", "err");
    }
  };

  return (
    <ModalShell title="Medical records" onClose={onClose}>
      <p
        className="text-[13px] mb-5 leading-relaxed"
        style={{ color: "var(--portal-text-muted)" }}
      >
        Upload referral letters, prior scripts, imaging reports or lab
        results. Files are encrypted at rest and only visible to you
        and your care team. Max 20 MB per file.
      </p>

      {/* Upload zone */}
      <label
        className="block rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors"
        style={{
          borderColor: "var(--portal-border)",
          background: "var(--portal-surface-2)",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = "var(--portal-accent)";
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--portal-border)";
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = "var(--portal-border)";
          const f = e.dataTransfer.files?.[0];
          if (f) handleUpload(f);
        }}
      >
        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.txt,image/*,application/pdf"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              handleUpload(f);
              e.target.value = ""; // allow re-uploading same filename
            }
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: "var(--portal-accent)" }}
            />
            <p
              className="text-[13px] font-medium"
              style={{ color: "var(--portal-text)" }}
            >
              Uploading…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload
              className="w-6 h-6"
              style={{ color: "var(--portal-accent)" }}
            />
            <p
              className="text-[13px] font-semibold"
              style={{ color: "var(--portal-text)" }}
            >
              Click or drag a file to upload
            </p>
            <p
              className="text-[11px]"
              style={{ color: "var(--portal-text-subtle)" }}
            >
              PDF, JPG, PNG, WEBP, DOC · up to 20 MB
            </p>
          </div>
        )}
      </label>

      {/* File list */}
      <div className="mt-6">
        <h4
          className="text-[11px] font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--portal-text-subtle)" }}
        >
          Your files
        </h4>
        {loading ? (
          <LoadingRows count={2} />
        ) : files.length === 0 ? (
          <p
            className="text-[13px] text-center py-6"
            style={{ color: "var(--portal-text-subtle)" }}
          >
            No files uploaded yet.
          </p>
        ) : (
          <ul
            className="divide-y rounded-xl overflow-hidden"
            style={{
              borderColor: "var(--portal-border)",
              border: "1px solid var(--portal-border)",
            }}
          >
            {files.map((f) => (
              <li
                key={f.path}
                className="flex items-center gap-3 p-3"
                style={{ borderColor: "var(--portal-border)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "var(--portal-accent-soft)",
                    color: "var(--portal-accent)",
                  }}
                >
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13px] font-semibold truncate"
                    style={{ color: "var(--portal-text)" }}
                    title={displayName(f.name)}
                  >
                    {displayName(f.name)}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--portal-text-subtle)" }}
                  >
                    {formatBytes(f.size)} ·{" "}
                    {new Date(f.created_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {f.url && (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "var(--portal-text-muted)" }}
                    title="View file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(f)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: "var(--portal-danger)" }}
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}

function displayName(raw: string): string {
  // Strip the timestamp prefix we added at upload time
  return raw.replace(/^\d{13}_/, "");
}

function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--portal-bg)",
          border: "1px solid var(--portal-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2
            className="font-serif text-xl font-semibold"
            style={{ color: "var(--portal-text)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full"
            style={{ color: "var(--portal-text-muted)" }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function humanAppointmentType(type: string): string {
  const map: Record<string, string> = {
    pre_screening: "Pre-Screening Call",
    initial_consultation: "Initial Consultation",
    follow_up: "Follow-Up Appointment",
    review: "Clinical Review",
  };
  return map[type] ?? type;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
