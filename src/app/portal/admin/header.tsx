"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  MessageSquare,
  Sun,
  Moon,
  ShieldCheck,
  Package,
} from "lucide-react";
import { useTheme } from "../theme-provider";
import type { StaffRole } from "@/lib/requireAdmin";

/**
 * AdminHeader — sticky top nav for the staff console.
 *
 * Client component because the theme toggle needs React state and
 * the active-tab highlight uses usePathname().
 *
 * The nav items are tuned for a telehealth MVP:
 *
 *   Home     — overview stats + today's activity
 *   Patients — list + detail view, eligibility approvals
 *   Schedule — all appointments across all patients
 *   Scripts  — prescription issuance + dispensing status
 *   Inbox    — contact-form enquiries
 *
 * More will land later (e.g. audit log, staff management) once the
 * core flows are solid.
 */
export default function AdminHeader({
  email,
  fullName,
  roles,
}: {
  email: string | null;
  fullName: string | null;
  roles: StaffRole[];
}) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  // Highest-weight role wins the badge: admin > doctor > nurse.
  const primaryRole: StaffRole = roles.includes("admin")
    ? "admin"
    : roles.includes("doctor")
      ? "doctor"
      : "nurse";

  const displayName = fullName ?? email?.split("@")[0] ?? "Staff";

  const navItems = [
    { href: "/portal/admin", label: "Home", icon: LayoutDashboard, exact: true },
    { href: "/portal/admin/patients", label: "Patients", icon: Users },
    { href: "/portal/admin/schedule", label: "Schedule", icon: Calendar },
    { href: "/portal/admin/scripts", label: "Scripts", icon: Pill },
    { href: "/portal/admin/inbox", label: "Inbox", icon: MessageSquare },
    // Pharma operations — wholesale ordering + inventory management
    // for the Pharmabackend B2B side of the business. Nested routes
    // live under /portal/admin/pharma.
    { href: "/portal/admin/pharma", label: "Pharma", icon: Package },
  ];

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-xl"
      style={{
        background: "var(--portal-surface-translucent)",
        borderBottom: "1px solid var(--portal-border)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Top row — brand, role badge, theme toggle */}
        <div className="flex items-center justify-between py-3">
          <Link href="/portal/admin" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "var(--portal-accent-soft)",
                color: "var(--portal-accent)",
              }}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[13px] font-bold leading-none"
                style={{ color: "var(--portal-text)" }}
              >
                Staff console
              </p>
              <p
                className="text-[10px] mt-0.5 leading-none"
                style={{ color: "var(--portal-text-subtle)" }}
              >
                Golden Ratio Clinics
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Role + user pill */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "var(--portal-surface-2)",
                border: "1px solid var(--portal-border)",
              }}
            >
              <RolePill role={primaryRole} />
              <span
                className="text-[12px] font-medium max-w-[140px] truncate"
                style={{ color: "var(--portal-text)" }}
                title={email ?? undefined}
              >
                {displayName}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: "var(--portal-surface-2)",
                border: "1px solid var(--portal-border)",
                color: "var(--portal-text-muted)",
              }}
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom row — navigation tabs */}
        <nav
          className="flex items-center gap-1 overflow-x-auto -mx-1 pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors"
                style={{
                  background: active
                    ? "var(--portal-accent-soft)"
                    : "transparent",
                  color: active
                    ? "var(--portal-accent)"
                    : "var(--portal-text-muted)",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/**
 * RolePill — tiny colour-coded badge showing the user's primary role.
 *
 * Colours are drawn from the existing portal palette so they match
 * the rest of the design. `admin` uses the accent colour, `doctor`
 * uses a tertiary blue, `nurse` uses a soft green.
 */
function RolePill({ role }: { role: StaffRole }) {
  const config: Record<StaffRole, { label: string; bg: string; fg: string }> = {
    admin: {
      label: "Admin",
      bg: "var(--portal-accent)",
      fg: "#fff",
    },
    doctor: {
      label: "Doctor",
      bg: "#3B82F6",
      fg: "#fff",
    },
    nurse: {
      label: "Nurse",
      bg: "#10B981",
      fg: "#fff",
    },
  };
  const c = config[role];
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
}
