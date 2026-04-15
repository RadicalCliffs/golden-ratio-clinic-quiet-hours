"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  ArrowRight, ArrowLeft, Shield, Clock, Heart, Phone, Mail, User,
  Menu, X, CheckCircle, AlertCircle,
  Stethoscope, ShieldCheck,
  ClipboardCheck, Video, Pill, CalendarCheck, MapPin,
  ChevronDown,
} from "lucide-react";
import SmoothScroll from "@/components/shared/SmoothScroll";
import ScrollReveal, { ScrollRevealStagger } from "@/components/shared/ScrollReveal";
import { FEATURED_DISPATCHES } from "@/lib/dispatches";

/* ═══════════════════════════════════════════════
   QUIET HOURS
   The Golden Ratio Clinics funnel page.

   Apothecary Editorial — restraint as luxury.
   Ivory/amber/sage palette, Playfair display italics,
   asterism dividers, indexed numerals, drop caps.
   Zero-radius grid preserved. Type does the decorative work.
   ═══════════════════════════════════════════════ */

const P = {
  // ─── Structural ink ───
  navy: "#1F1C17",          // Softened warm charcoal (was #0A0828)
  charcoal: "#2A2822",      // Body ink
  white: "#FFFFFF",
  text: "#1F1C17",
  muted: "#6B6558",         // Warm muted ink (was cool #5A5878)
  border: "#E4DCC8",        // Ivory-toned rule (was cool lavender)

  // ─── Saturation — reserved for one CTA moment ───
  pink: "#EC1368",          // Brand CTA only. Used sparingly.
  green: "#5B6F4A",         // Muted sage-olive (was vivid #008959)
  lime: "#97E600",          // Legacy accent (footer/news ticker only)

  // ─── Surface palette — the Aesop walk ───
  // Repurposed pastel tokens so existing references adopt the new direction.
  pastelBlue: "#F4EEE0",    // Base ivory (was bright cyan)
  pastelPink: "#EFE6D2",    // Warm ivory
  pastelGreen: "#E4E5D2",   // Sage-washed ivory
  pastelGold: "#ECE0C3",    // Amber ivory

  // ─── Aesop semantic names — used in new code ───
  ivory: "#F6F1E8",         // Paper
  ivoryWarm: "#F0EADC",     // Paper, held near a lamp
  amber: "#E8D9B8",         // Amber wash
  amberDeep: "#C9A65B",     // Rare highlight (phi medallion ring)
  sage: "#C9CDB8",          // Muted olive-sage
  sageDeep: "#5B6F4A",      // Sage ink
  inkRose: "#A85C6B",       // The single ornamental accent
};

/* ─── Quiet Hours decorative primitives ───
   Every ornament here is typographic. No sparkles, no gradients,
   no scribbles. Just rules, asterisms, and considered italics. */

/* Asterism divider — centered ⁂ flanked by hairline rules.
   Replaces WaveDivider for a more editorial section transition. */
function Asterism({
  className,
  color = P.inkRose,
  width = "max-w-xs",
}: {
  className?: string;
  color?: string;
  width?: string;
}) {
  return (
    <div className={`flex items-center justify-center mx-auto ${width} ${className ?? ""}`}>
      <span className="flex-1 h-px" style={{ background: P.charcoal, opacity: 0.22 }} />
      <span
        className="px-4 font-[family-name:var(--font-display)] text-base leading-none"
        style={{ color, opacity: 0.85 }}
        aria-hidden="true"
      >
        ⁂
      </span>
      <span className="flex-1 h-px" style={{ background: P.charcoal, opacity: 0.22 }} />
    </div>
  );
}

/* Small-caps editorial eyebrow — replaces loud pink uppercase labels.
   Playfair italic, charcoal ink, short hairlines bracketing the text. */
function Eyebrow({
  children,
  className,
  color = P.charcoal,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={`inline-flex items-center justify-center gap-3 ${className ?? ""}`}
      style={{ color }}
    >
      <span className="h-px w-7" style={{ background: color, opacity: 0.45 }} />
      <span
        className="font-[family-name:var(--font-display)] italic"
        style={{
          fontSize: "0.72rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontVariantCaps: "all-small-caps",
          fontWeight: 400,
        }}
      >
        {children}
      </span>
      <span className="h-px w-7" style={{ background: color, opacity: 0.45 }} />
    </div>
  );
}

/* Editorial index numeral — Playfair italic with № prefix and roman
   numeral. Used for Process steps and FAQ marginalia. */
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function Numeral({
  n,
  className,
  color = P.inkRose,
  size = "md",
}: {
  n: number;
  className?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  return (
    <span
      className={`font-[family-name:var(--font-display)] italic ${sizeMap[size]} ${className ?? ""}`}
      style={{ color, letterSpacing: "0.04em" }}
    >
      <span style={{ fontSize: "0.62em", marginRight: "0.15em", opacity: 0.8 }}>№</span>
      {ROMAN[n - 1] ?? n}
    </span>
  );
}

/* Emphasis underline — a single 1px ink-rose hairline under italic <em>.
   Restrained editorial accent. No animation. */
function Emph({
  children,
  color = P.inkRose,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <em
      className="relative inline-block not-italic"
      style={{
        fontStyle: "italic",
        color,
      }}
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute left-0 right-0"
        style={{
          bottom: "0.04em",
          height: "1px",
          background: color,
          opacity: 0.7,
        }}
      />
    </em>
  );
}

/* ─── Hairline circle — single geometric mark (formerly FloatingShape)
   Replaces the five-blob botanical parallax with one quiet sage ring.
   No animation, no gradient — a considered marginal ornament. */
function HairlineCircle({
  className,
  style,
  color = P.sage,
}: {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="0.6" opacity="0.6" />
      <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="0.4" opacity="0.35" />
    </svg>
  );
}

/* Legacy alias — a few sections still reference FloatingShape.
   Routed to HairlineCircle so existing call sites pick up the new look
   without requiring a sweeping rename. */
const FloatingShape = HairlineCircle;

/* ─── Editorial rule divider ───
   Replaces WaveDivider. A single hairline across the page with a centered
   asterism. Section color transitions happen via the background itself,
   not the divider. */
function RuleDivider({ color = P.charcoal, ornament = true }: { color?: string; ornament?: boolean }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="flex items-center gap-6 max-w-xl mx-auto">
        <span className="flex-1 h-px" style={{ background: color, opacity: 0.22 }} />
        {ornament && (
          <span
            className="font-[family-name:var(--font-display)] text-lg leading-none"
            style={{ color: P.inkRose, opacity: 0.85 }}
            aria-hidden="true"
          >
            ⁂
          </span>
        )}
        <span className="flex-1 h-px" style={{ background: color, opacity: 0.22 }} />
      </div>
    </div>
  );
}

/* Legacy alias — old WaveDivider call sites route to RuleDivider.
   The `fill` prop is ignored; the background between sections handles
   color transitions now. */
function WaveDivider({ fill: _fill, flip: _flip }: { fill?: string; flip?: boolean }) {
  return <RuleDivider />;
}

/* ─── Navigation ───
   Nav labels mirror the editorial section names used throughout
   the Quiet Hours funnel. Dispatches links to the inline homepage
   section; the full reading list lives at /news. */
const navLinks = [
  { label: "The Itinerary", href: "#process" },
  { label: "The Principles", href: "#services" },
  { label: "An Enquiry", href: "#quiz" },
  { label: "On the House", href: "#about" },
  { label: "Dispatches", href: "/news" },
  { label: "Marginalia", href: "#faq" },
];

function LickiesNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-2.5 sm:py-3" : "py-3 sm:py-5"}`}
      style={{
        background: scrolled ? `${P.ivory}ee` : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${P.border}` : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Quiet Hours wordmark — sole identity. No parent branding. */}
        <a href="#" className="flex items-center gap-3 flex-shrink min-w-0" aria-label="Quiet Hours">
          <span
            className="font-[family-name:var(--font-display)] leading-none"
            style={{
              color: P.inkRose,
              fontSize: "1.1rem",
              opacity: 0.85,
            }}
            aria-hidden="true"
          >
            ⁂
          </span>
          <span
            className="font-[family-name:var(--font-display)] italic whitespace-nowrap"
            style={{
              color: P.charcoal,
              fontSize: "1.2rem",
              letterSpacing: "0.02em",
              fontWeight: 500,
            }}
          >
            Quiet Hours
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-[family-name:var(--font-display)] italic transition-colors hover:opacity-60 whitespace-nowrap"
              style={{
                color: P.charcoal,
                fontSize: "0.72rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontVariantCaps: "all-small-caps",
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA cluster — always visible, all buttons no-wrap */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <a
            href="/portal/login"
            className="hidden sm:inline-flex items-center px-4 py-2.5 whitespace-nowrap font-[family-name:var(--font-display)] italic transition-all duration-300"
            style={{
              color: P.charcoal,
              border: `1px solid ${P.charcoal}`,
              borderRadius: 0,
              fontSize: "0.68rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
            }}
          >
            Sign In
          </a>
          <a
            href="/portal/signup"
            className="inline-flex items-center px-3 sm:px-5 py-2 sm:py-2.5 transition-all duration-300 hover:opacity-90 whitespace-nowrap font-[family-name:var(--font-display)] italic"
            style={{
              background: P.pink,
              color: P.white,
              borderRadius: 0,
              fontSize: "0.68rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
            }}
          >
            Sign Up
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-1.5 sm:p-2 ml-0.5 flex-shrink-0"
            style={{ color: P.charcoal }}
            aria-label="Menu"
          >
            {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="lg:hidden absolute top-full left-0 right-0"
          style={{ background: P.ivory, borderTop: `1px solid ${P.border}` }}
        >
          <nav className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setIsOpen(false)}
                className="py-3 px-4 font-[family-name:var(--font-display)] italic"
                style={{
                  color: P.charcoal,
                  fontSize: "0.95rem",
                  letterSpacing: "0.06em",
                }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#booking"
              onClick={() => setIsOpen(false)}
              className="mt-4 py-3 px-6 text-center font-[family-name:var(--font-display)] italic"
              style={{
                background: P.pink,
                color: P.white,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontSize: "0.78rem",
              }}
            >
              Book Now
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ─── Hero ───
   Quiet Hours — the identity moment. Single hairline circle sits
   behind the headline like a moon through ivory paper. Asterism and
   small-caps eyebrow frame the H1. No floating shapes. */
function LickiesHero() {
  return (
    <section
      className="relative min-h-[100svh] flex items-center overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${P.ivoryWarm} 0%, ${P.pastelBlue} 55%, ${P.amber}55 100%)`,
      }}
    >
      {/* Single quiet sage hairline circle — the one geometric mark */}
      <HairlineCircle
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[72vmin] h-[72vmin] opacity-55 pointer-events-none"
      />

      <div className="relative w-full max-w-4xl mx-auto px-5 sm:px-6 text-center pt-28 sm:pt-32 pb-20 sm:pb-24">
        {/* Small-caps practitioner badge — muted, not shouting.
            No whitespace-nowrap: the text is long enough to overflow
            narrow phone viewports if forced on one line. Allowing it
            to wrap keeps the full trust signal visible at any width. */}
        <div
          className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 mb-10 sm:mb-12 max-w-[calc(100%-1rem)]"
          style={{ border: `1px solid ${P.charcoal}28`, background: "transparent" }}
        >
          <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: P.sageDeep }} />
          <span
            className="font-[family-name:var(--font-display)] italic"
            style={{
              color: P.charcoal,
              fontSize: "0.68rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
            }}
          >
            Australian-Registered Practitioners
          </span>
        </div>

        {/* Quiet Hours wordmark — the page identity */}
        <p
          className="font-[family-name:var(--font-display)] italic mb-6 sm:mb-8"
          style={{
            color: P.inkRose,
            fontSize: "clamp(1.05rem, 1.6vw, 1.35rem)",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            fontVariantCaps: "all-small-caps",
            fontWeight: 400,
          }}
        >
          Quiet&nbsp;&nbsp;Hours
        </p>

        <h1
          className="font-[family-name:var(--font-display)] font-medium leading-[1.02] mb-8 sm:mb-10 break-words"
          style={{
            color: P.charcoal,
            fontSize: "clamp(2.4rem, 7.2vw, 5.6rem)",
            letterSpacing: "-0.025em",
          }}
        >
          A more considered approach
          <br />
          <Emph>to your wellbeing</Emph>
        </h1>

        {/* Asterism — replaces the wave divider, sets the editorial tone */}
        <div className="max-w-[14rem] mx-auto mb-10 sm:mb-12">
          <Asterism />
        </div>

        <p
          className="text-lg sm:text-xl mb-12 sm:mb-14 max-w-xl mx-auto px-2 font-[family-name:var(--font-display)]"
          style={{
            color: P.muted,
            lineHeight: "1.75",
            fontStyle: "italic",
            fontWeight: 400,
          }}
        >
          Telehealth consultations with Australian-registered medical
          practitioners. Confidential, unhurried, by appointment.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto sm:max-w-none">
          <a
            href="#booking"
            className="inline-flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 font-semibold text-[14px] sm:text-base transition-all duration-300 hover:opacity-90 whitespace-nowrap"
            style={{
              background: P.pink,
              color: P.white,
              borderRadius: 0,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Book Pre-Screening <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </a>
          <a
            href="#quiz"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 font-semibold text-[14px] sm:text-base transition-all duration-300 whitespace-nowrap"
            style={{
              border: `1px solid ${P.charcoal}`,
              color: P.charcoal,
              borderRadius: 0,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Check Eligibility
          </a>
        </div>

        <p
          className="mt-14 sm:mt-16 font-[family-name:var(--font-display)] italic"
          style={{
            color: P.muted,
            fontSize: "0.78rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontVariantCaps: "all-small-caps",
            opacity: 0.7,
          }}
        >
          By appointment &nbsp;·&nbsp; Across Australia
        </p>
      </div>
    </section>
  );
}

/* ─── Process — The Itinerary ───
   Five steps, editorially numbered. Ivory/amber cards with hairline
   rules. Numerals are the ornament. */
const steps = [
  { icon: Phone, title: "Pre-Screening", desc: "A confidential conversation with a qualified nurse.", time: "5–10 min" },
  { icon: ClipboardCheck, title: "Intake", desc: "A simple form for your medical history.", time: "10–15 min" },
  { icon: Video, title: "Consultation", desc: "Meet an Australian-registered practitioner via telehealth.", time: "15–20 min" },
  { icon: Pill, title: "Dispensing", desc: "Should the doctor prescribe, your script is issued and dispensed.", time: "1–3 days" },
  { icon: CalendarCheck, title: "Aftercare", desc: "Unhurried follow-ups at a rhythm that suits you.", time: "4–12 weeks" },
];

function LickiesProcess() {
  return (
    <section id="process" className="py-24 lg:py-32" style={{ background: P.ivory }}>
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
            <Eyebrow className="mb-6">The Itinerary</Eyebrow>
            <h2
              className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-medium mb-6"
              style={{ color: P.charcoal, letterSpacing: "-0.02em" }}
            >
              Five steps, <Emph>unhurried</Emph>
            </h2>
            <div className="max-w-xs mx-auto mt-8">
              <Asterism />
            </div>
          </div>
        </ScrollReveal>

        {/* Grid-outline pattern: wrapper supplies top/left hairlines,
            each cell supplies its own right/bottom. Works identically
            at 1, 2, and 5 columns so the frame looks correct on any
            viewport without inline-style breakpoint gymnastics. */}
        <ScrollRevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
          style={{
            borderTop: `1px solid ${P.border}`,
            borderLeft: `1px solid ${P.border}`,
          }}
          stagger={0.08}
        >
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative p-8 lg:p-9 transition-all duration-300 group"
              style={{
                background: i % 2 === 0 ? P.ivoryWarm : P.ivory,
                borderRight: `1px solid ${P.border}`,
                borderBottom: `1px solid ${P.border}`,
                borderRadius: 0,
              }}
            >
              <div className="flex items-baseline justify-between mb-6">
                <Numeral n={i + 1} size="lg" />
                <span
                  className="font-[family-name:var(--font-display)] italic"
                  style={{
                    color: P.muted,
                    fontSize: "0.66rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontVariantCaps: "all-small-caps",
                  }}
                >
                  {s.time}
                </span>
              </div>
              <s.icon className="w-5 h-5 mb-5" style={{ color: P.sageDeep }} />
              <h3
                className="font-[family-name:var(--font-display)] text-xl mb-3"
                style={{ color: P.charcoal, letterSpacing: "-0.01em" }}
              >
                {s.title}
              </h3>
              <p
                className="text-[14px] leading-relaxed font-[family-name:var(--font-display)] italic"
                style={{ color: P.muted }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </ScrollRevealStagger>
      </div>
    </section>
  );
}

/* ─── Our Practice — The Principles ───
   Six tenets of the practice, set as a hairline-ruled index card grid.
   All iconography sage; headline italics; muted warm ivory backdrop. */
const conditions = [
  { icon: Stethoscope, title: "Doctor-Led Care", desc: "Australian-registered medical practitioners with current Ahpra registration." },
  { icon: Heart, title: "Nurse-Led Intake", desc: "Registered nurses walk with you through every step before your consultation." },
  { icon: Shield, title: "Strictly Confidential", desc: "Your information is protected under the Australian Privacy Principles." },
  { icon: Video, title: "Telehealth Convenience", desc: "Secure video or phone consultations from anywhere in Australia." },
  { icon: Clock, title: "Considered & Unrushed", desc: "Every patient is given the time they deserve with their doctor." },
  { icon: ShieldCheck, title: "Australia-Wide", desc: "Telehealth coverage across every state and territory." },
];

function LickiesServices() {
  return (
    <section id="services" className="py-24 lg:py-32" style={{ background: P.pastelPink }}>
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow className="mb-6">The Principles</Eyebrow>
            <h2
              className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-medium"
              style={{ color: P.charcoal, letterSpacing: "-0.02em" }}
            >
              Patient-centred <Emph>telehealth</Emph>
            </h2>
            <div className="max-w-xs mx-auto mt-8">
              <Asterism />
            </div>
          </div>
        </ScrollReveal>

        {/* Grid-outline pattern — see LickiesProcess for the rationale.
            Wrapper supplies top/left, each cell supplies right/bottom,
            so the frame works at 1, 2, or 3 columns. */}
        <ScrollRevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0"
          style={{
            borderTop: `1px solid ${P.border}`,
            borderLeft: `1px solid ${P.border}`,
          }}
          stagger={0.06}
        >
          {conditions.map((c, i) => (
            <div
              key={c.title}
              className="p-10 group transition-all duration-500"
              style={{
                background: P.ivory,
                borderRight: `1px solid ${P.border}`,
                borderBottom: `1px solid ${P.border}`,
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Numeral n={i + 1} size="sm" />
                <span className="flex-1 h-px" style={{ background: P.charcoal, opacity: 0.18 }} />
              </div>
              <c.icon className="w-5 h-5 mb-5" style={{ color: P.sageDeep }} />
              <h3
                className="font-[family-name:var(--font-display)] text-xl mb-3"
                style={{ color: P.charcoal, letterSpacing: "-0.01em" }}
              >
                {c.title}
              </h3>
              <p
                className="text-[14px] leading-relaxed font-[family-name:var(--font-display)] italic"
                style={{ color: P.muted }}
              >
                {c.desc}
              </p>
            </div>
          ))}
        </ScrollRevealStagger>

        <ScrollReveal delay={0.2}>
          <div
            className="mt-14 px-8 py-6 text-center max-w-3xl mx-auto"
            style={{ border: `1px solid ${P.charcoal}25`, background: "transparent" }}
          >
            <p
              className="font-[family-name:var(--font-display)] italic leading-relaxed"
              style={{ color: P.muted, fontSize: "0.88rem", letterSpacing: "0.02em" }}
            >
              <span
                style={{
                  color: P.charcoal,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontVariantCaps: "all-small-caps",
                  fontSize: "0.78rem",
                }}
              >
                TGA Regulated
              </span>
              <span style={{ margin: "0 0.7rem", color: P.inkRose }}>·</span>
              All prescribing under the TGA Special Access Scheme. A consultation does not guarantee a prescription.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Service Eligibility ─── */
const questions = [
  { id: "age", question: "Are you 18 or older?", subtext: "Our consultations are for adults only.", options: [{ label: "Yes", value: "yes", score: 1 }, { label: "No", value: "no", score: 0 }] },
  { id: "location", question: "Currently in Australia?", subtext: "Our practitioners can only consult patients located in Australia.", options: [{ label: "Yes", value: "yes", score: 1 }, { label: "No", value: "no", score: 0 }] },
  { id: "history", question: "Have you previously consulted a doctor?", subtext: "Helpful for our clinical team to know your history.", options: [{ label: "Yes, regularly", value: "regular", score: 2 }, { label: "Occasionally", value: "occasional", score: 1 }, { label: "Not in recent years", value: "none", score: 1 }] },
  { id: "ready", question: "Comfortable with telehealth?", subtext: "Telehealth consultations are equivalent to in-person under Australian law.", options: [{ label: "Yes", value: "yes", score: 2 }, { label: "Prefer phone", value: "phone", score: 2 }, { label: "Not sure", value: "unsure", score: 1 }] },
  { id: "expectation", question: "What would you like to discuss?", subtext: "Helps our intake team prepare for your appointment.", options: [{ label: "General wellbeing", value: "general", score: 1 }, { label: "Long-standing concern", value: "ongoing", score: 1 }, { label: "Second opinion", value: "second", score: 1 }, { label: "Prefer to discuss with doctor", value: "private", score: 1 }] },
];

function LickiesQuiz() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const total = questions.length;
  const progress = step >= 0 ? ((step + 1) / total) * 100 : 0;

  const handleAnswer = (qId: string, val: string, score: number) => {
    setAnswers((p) => ({ ...p, [qId]: val }));
    setScores((p) => ({ ...p, [qId]: score }));
    setTimeout(() => {
      if (step < total - 1) setStep((s) => s + 1);
      else {
        setStep(total);
        const ts = Object.values({ ...scores, [qId]: score }).reduce((a, b) => a + b, 0);
        fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: { ...answers, [qId]: val }, totalScore: ts, resultCategory: ts >= 5 ? "likely_eligible" : ts >= 3 ? "possibly_eligible" : "not_eligible" }) }).catch(() => {});
      }
    }, 400);
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <section id="quiz" className="py-24 lg:py-32" style={{ background: P.pastelGold }}>
      <div className="max-w-2xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <Eyebrow className="mb-6">An Enquiry in Five Parts</Eyebrow>
            <h2
              className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-medium"
              style={{ color: P.charcoal }}
            >
              Am I <Emph>eligible?</Emph>
            </h2>
            <div className="max-w-xs mx-auto mt-8">
              <Asterism />
            </div>
          </div>
        </ScrollReveal>

        <div className="overflow-hidden" style={{ background: P.ivory, border: `1px solid ${P.border}`, borderRadius: 0 }}>
          {step >= 0 && step < total && (
            <div className="h-px" style={{ background: `${P.charcoal}20` }}>
              <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: P.inkRose }} />
            </div>
          )}
          <div className="p-8 lg:p-12">
            {step === -1 && (
              <div className="text-center py-6">
                <div
                  className="font-[family-name:var(--font-display)] italic mx-auto mb-6"
                  style={{ color: P.inkRose, fontSize: "2rem", lineHeight: 1 }}
                  aria-hidden="true"
                >
                  ⁂
                </div>
                <h3
                  className="font-[family-name:var(--font-display)] text-3xl mb-4"
                  style={{ color: P.charcoal }}
                >
                  A Brief Enquiry
                </h3>
                <p
                  className="mb-10 max-w-md mx-auto font-[family-name:var(--font-display)] italic"
                  style={{ color: P.muted, lineHeight: 1.7 }}
                >
                  Five considered questions. Not a medical assessment.
                </p>
                <button
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-3 px-10 py-4 font-[family-name:var(--font-display)] italic"
                  style={{
                    background: P.pink,
                    color: P.white,
                    borderRadius: 0,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontSize: "0.8rem",
                  }}
                >
                  Begin <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step >= 0 && step < total && (
              <div key={step}>
                <div className="flex justify-between items-center mb-8">
                  <Numeral n={step + 1} size="md" />
                  {step > 0 && (
                    <button
                      onClick={() => setStep((s) => s - 1)}
                      className="flex items-center gap-1 font-[family-name:var(--font-display)] italic"
                      style={{
                        color: P.muted,
                        fontSize: "0.72rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                      }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}
                </div>
                <h3
                  className="font-[family-name:var(--font-display)] text-2xl mb-3"
                  style={{ color: P.charcoal }}
                >
                  {questions[step].question}
                </h3>
                <p className="mb-8 font-[family-name:var(--font-display)] italic" style={{ color: P.muted, lineHeight: 1.7 }}>
                  {questions[step].subtext}
                </p>
                <div className="space-y-3">
                  {questions[step].options.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => handleAnswer(questions[step].id, o.value, o.score)}
                      className="w-full text-left p-5 transition-all duration-200"
                      style={{
                        border: `1px solid ${answers[questions[step].id] === o.value ? P.inkRose : P.border}`,
                        background: answers[questions[step].id] === o.value ? `${P.inkRose}08` : P.white,
                        borderRadius: 0,
                      }}
                    >
                      <span
                        className="font-[family-name:var(--font-display)]"
                        style={{ color: P.charcoal, fontSize: "1rem" }}
                      >
                        {o.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === total && (
              <div className="text-center py-6">
                {totalScore >= 5 ? (
                  <>
                    <div
                      className="font-[family-name:var(--font-display)] italic mx-auto mb-6"
                      style={{ color: P.sageDeep, fontSize: "2rem", lineHeight: 1 }}
                      aria-hidden="true"
                    >
                      ⁂
                    </div>
                    <h3 className="font-[family-name:var(--font-display)] text-3xl mb-4" style={{ color: P.charcoal }}>
                      You may be a good candidate
                    </h3>
                  </>
                ) : totalScore >= 3 ? (
                  <>
                    <div
                      className="font-[family-name:var(--font-display)] italic mx-auto mb-6"
                      style={{ color: P.inkRose, fontSize: "2rem", lineHeight: 1 }}
                      aria-hidden="true"
                    >
                      ⁂
                    </div>
                    <h3 className="font-[family-name:var(--font-display)] text-3xl mb-4" style={{ color: P.charcoal }}>
                      Let&apos;s chat
                    </h3>
                  </>
                ) : (
                  <>
                    <div
                      className="font-[family-name:var(--font-display)] italic mx-auto mb-6"
                      style={{ color: P.muted, fontSize: "2rem", lineHeight: 1 }}
                      aria-hidden="true"
                    >
                      ⁂
                    </div>
                    <h3 className="font-[family-name:var(--font-display)] text-3xl mb-4" style={{ color: P.charcoal }}>
                      May not be the right fit now
                    </h3>
                  </>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
                  <a
                    href="#booking"
                    className="inline-flex items-center gap-2 px-10 py-4 font-[family-name:var(--font-display)] italic"
                    style={{
                      background: P.pink,
                      color: P.white,
                      borderRadius: 0,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontSize: "0.8rem",
                    }}
                  >
                    Book Pre-Screening <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => { setStep(-1); setAnswers({}); setScores({}); }}
                    className="px-10 py-4 font-[family-name:var(--font-display)] italic"
                    style={{
                      border: `1px solid ${P.charcoal}`,
                      color: P.charcoal,
                      borderRadius: 0,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontSize: "0.8rem",
                    }}
                  >
                    Retake
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Booking Form ─── */
const timeSlots = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM"];

function LickiesBooking() {
  const [fd, setFd] = useState({ firstName: "", lastName: "", email: "", phone: "", preferredDate: "", preferredTime: "", contactMethod: "phone", message: "", consent: false });
  const [status, setStatus] = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [err, setErr] = useState("");
  const hc = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => {
    const t = e.target; const v = t instanceof HTMLInputElement && t.type === "checkbox" ? t.checked : t.value;
    setFd((p) => ({ ...p, [t.name]: v }));
  };
  const hs = async (e: FormEvent) => {
    e.preventDefault(); setStatus("submitting"); setErr("");
    try { const r = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fd) }); if (!r.ok) { const d = await r.json(); throw new Error(d.error); } setStatus("success"); setFd({ firstName: "", lastName: "", email: "", phone: "", preferredDate: "", preferredTime: "", contactMethod: "phone", message: "", consent: false }); } catch (e) { setStatus("error"); setErr(e instanceof Error ? e.message : "Try again."); }
  };
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const minDate = tomorrow.toISOString().split("T")[0];
  const inp = "w-full px-4 py-3.5 text-[15px] outline-none transition-all duration-200";

  // Shared Aesop-style input styles
  const fieldStyle: React.CSSProperties = {
    background: P.white,
    border: `1px solid ${P.border}`,
    color: P.charcoal,
    borderRadius: 0,
    fontFamily: "var(--font-display), serif",
    fontStyle: "italic",
  };
  const labelCls = "block mb-2 font-[family-name:var(--font-display)] italic";
  const labelStyle: React.CSSProperties = {
    color: P.charcoal,
    fontSize: "0.68rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    fontVariantCaps: "all-small-caps",
  };

  return (
    <section id="booking" className="py-24 lg:py-32" style={{ background: P.white }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <ScrollReveal>
            <div>
              <Eyebrow className="mb-6">The Pre-Screening</Eyebrow>
              <h2
                className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-medium mb-8"
                style={{ color: P.charcoal, letterSpacing: "-0.02em" }}
              >
                Begin with an <Emph>unhurried call</Emph>
              </h2>
              <div className="max-w-xs mb-10">
                <Asterism />
              </div>
              <p
                className="text-lg mb-12 font-[family-name:var(--font-display)] italic"
                style={{ color: P.muted, lineHeight: "1.75" }}
              >
                Confidential, at no cost, without obligation. A qualified nurse will receive your call at a time that suits you.
              </p>
              <div className="space-y-5">
                {[
                  { icon: Clock, t: "A 5–10 minute conversation" },
                  { icon: User, t: "With a registered nurse" },
                  { icon: Shield, t: "Confidential, always" },
                  { icon: CheckCircle, t: "No cost, no pressure" },
                ].map((i) => (
                  <div key={i.t} className="flex items-center gap-4">
                    <i.icon className="w-4 h-4 flex-shrink-0" style={{ color: P.sageDeep }} />
                    <p
                      className="font-[family-name:var(--font-display)] italic"
                      style={{ color: P.charcoal, fontSize: "0.98rem" }}
                    >
                      {i.t}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            {status === "success" ? (
              <div
                className="p-12 text-center"
                style={{ background: P.ivoryWarm, border: `1px solid ${P.border}` }}
              >
                <div
                  className="font-[family-name:var(--font-display)] italic mx-auto mb-6"
                  style={{ color: P.sageDeep, fontSize: "2rem", lineHeight: 1 }}
                  aria-hidden="true"
                >
                  ⁂
                </div>
                <h3
                  className="font-[family-name:var(--font-display)] text-3xl mb-4"
                  style={{ color: P.charcoal }}
                >
                  Thank you
                </h3>
                <p
                  className="mb-8 font-[family-name:var(--font-display)] italic"
                  style={{ color: P.muted, lineHeight: 1.7 }}
                >
                  We shall be in touch within one business day.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="px-10 py-3 font-[family-name:var(--font-display)] italic"
                  style={{
                    border: `1px solid ${P.charcoal}`,
                    color: P.charcoal,
                    borderRadius: 0,
                    fontSize: "0.72rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  Book Another
                </button>
              </div>
            ) : (
              <form
                onSubmit={hs}
                className="p-5 sm:p-8 lg:p-10"
                style={{ background: P.ivoryWarm, border: `1px solid ${P.border}` }}
              >
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  {[{ n: "firstName", l: "First Name", p: "Jane" }, { n: "lastName", l: "Last Name", p: "Smith" }].map((f) => (
                    <div key={f.n}>
                      <label className={labelCls} style={labelStyle}>{f.l}</label>
                      <input
                        type="text"
                        name={f.n}
                        required
                        value={(fd as Record<string, string | boolean>)[f.n] as string}
                        onChange={hc}
                        className={inp}
                        placeholder={f.p}
                        style={fieldStyle}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className={labelCls} style={labelStyle}>Email</label>
                    <input type="email" name="email" required value={fd.email} onChange={hc} className={inp} placeholder="jane@example.com" style={fieldStyle} />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Telephone</label>
                    <input type="tel" name="phone" required value={fd.phone} onChange={hc} className={inp} placeholder="0412 345 678" style={fieldStyle} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className={labelCls} style={labelStyle}>Date</label>
                    <input type="date" name="preferredDate" required min={minDate} value={fd.preferredDate} onChange={hc} className={inp} style={fieldStyle} />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Time</label>
                    <select name="preferredTime" required value={fd.preferredTime} onChange={hc} className={inp} style={fieldStyle}>
                      <option value="">Select</option>
                      {timeSlots.map((s) => <option key={s} value={s}>{s} AEST</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-5">
                  <label className={labelCls} style={labelStyle}>Preferred Contact</label>
                  <div className="flex gap-3">
                    {[{ v: "phone", l: "Phone" }, { v: "video", l: "Video" }].map((o) => (
                      <label
                        key={o.v}
                        className="flex items-center gap-2 px-5 py-3 cursor-pointer transition-all font-[family-name:var(--font-display)] italic"
                        style={{
                          border: `1px solid ${fd.contactMethod === o.v ? P.inkRose : P.border}`,
                          background: fd.contactMethod === o.v ? `${P.inkRose}0C` : P.white,
                          borderRadius: 0,
                          color: P.charcoal,
                          fontSize: "0.9rem",
                        }}
                      >
                        <input type="radio" name="contactMethod" value={o.v} checked={fd.contactMethod === o.v} onChange={hc} className="sr-only" />
                        <span>{o.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className={labelCls} style={labelStyle}>A Brief Note <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  <textarea name="message" rows={3} value={fd.message} onChange={hc} className={`${inp} resize-none`} placeholder="Anything you'd like us to know in advance" style={fieldStyle} />
                </div>
                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <input type="checkbox" name="consent" required checked={fd.consent} onChange={hc} className="mt-1 w-4 h-4 flex-shrink-0" />
                  <span
                    className="font-[family-name:var(--font-display)] italic leading-relaxed"
                    style={{ color: P.muted, fontSize: "0.85rem" }}
                  >
                    I consent to being contacted. My information is handled in accordance with the Australian Privacy Principles.
                  </span>
                </label>
                {status === "error" && (
                  <div className="flex items-center gap-2 p-4 mb-4" style={{ background: "#FBEFEF", border: `1px solid #E5C7C7` }}>
                    <AlertCircle className="w-4 h-4" style={{ color: "#A83B3B" }} />
                    <p className="text-[13px]" style={{ color: "#7A2A2A" }}>{err}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full py-4 font-[family-name:var(--font-display)] italic transition-all disabled:opacity-50 whitespace-nowrap"
                  style={{
                    background: P.pink,
                    color: P.white,
                    borderRadius: 0,
                    fontSize: "0.82rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  {status === "submitting" ? "Submitting…" : "Request My Call"}
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ─── About — On the House ───
   The Quiet Hours manifesto. No Golden Ratio branding.
   Editorial column with drop cap, paired with a half-title-page
   composition in place of the old phi medallion. */
function LickiesAbout() {
  return (
    <section id="about" className="py-24 lg:py-32" style={{ background: P.pastelBlue }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <div>
              <Eyebrow className="mb-6">On the House</Eyebrow>
              <h2
                className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-medium mb-10"
                style={{ color: P.charcoal, letterSpacing: "-0.02em" }}
              >
                An unhurried <Emph>threshold</Emph>
              </h2>
              <p
                className="qh-dropcap text-lg leading-[1.85] mb-6 font-[family-name:var(--font-display)]"
                style={{ color: P.charcoal }}
              >
                Quiet Hours began as a simple question — what would it feel like to consult a doctor at one&apos;s own pace? Without the clamour, without the rush, without the quiet apology for taking up time. This is our answer.
              </p>
              <p
                className="text-lg leading-[1.85] mb-6 font-[family-name:var(--font-display)] italic"
                style={{ color: P.muted }}
              >
                A small, considered threshold through which Australians may find an unhurried conversation with a practitioner who is genuinely listening.
              </p>
              <div className="max-w-xs mt-10 mb-8">
                <Asterism />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                {[
                  { n: "Unhurried", l: "By design" },
                  { n: "Australian", l: "Wherever you are" },
                  { n: "Confidential", l: "Always" },
                ].map((s) => (
                  <div key={s.l}>
                    <p
                      className="font-[family-name:var(--font-display)] italic mb-1"
                      style={{
                        color: P.inkRose,
                        fontSize: "1.2rem",
                        letterSpacing: "-0.005em",
                        lineHeight: 1.2,
                      }}
                    >
                      {s.n}
                    </p>
                    <p
                      className="font-[family-name:var(--font-display)] italic"
                      style={{
                        color: P.muted,
                        fontSize: "0.65rem",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        fontVariantCaps: "all-small-caps",
                      }}
                    >
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            {/* Half-title page — a bookplate composition for Quiet Hours */}
            <div
              className="relative aspect-[3/4] flex items-center justify-center mx-auto w-full max-w-sm"
              style={{
                background: P.ivory,
                border: `1px solid ${P.border}`,
                boxShadow: `inset 0 0 0 8px ${P.ivoryWarm}, inset 0 0 0 9px ${P.border}`,
              }}
            >
              <div className="relative text-center px-8 py-12">
                <p
                  className="font-[family-name:var(--font-display)] italic mb-10"
                  style={{
                    color: P.muted,
                    fontSize: "0.68rem",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    fontVariantCaps: "all-small-caps",
                  }}
                >
                  Volume &nbsp;·&nbsp; № I
                </p>

                <h3
                  className="font-[family-name:var(--font-display)] italic mb-2"
                  style={{
                    color: P.charcoal,
                    fontSize: "clamp(2rem, 4.2vw, 2.75rem)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                  }}
                >
                  Quiet
                </h3>
                <h3
                  className="font-[family-name:var(--font-display)] italic mb-8"
                  style={{
                    color: P.charcoal,
                    fontSize: "clamp(2rem, 4.2vw, 2.75rem)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                  }}
                >
                  Hours
                </h3>

                <div className="flex items-center gap-3 justify-center mb-8">
                  <span className="h-px w-10" style={{ background: P.charcoal, opacity: 0.3 }} />
                  <span
                    className="font-[family-name:var(--font-display)] leading-none"
                    style={{ color: P.inkRose, fontSize: "1.1rem" }}
                    aria-hidden="true"
                  >
                    ⁂
                  </span>
                  <span className="h-px w-10" style={{ background: P.charcoal, opacity: 0.3 }} />
                </div>

                <p
                  className="font-[family-name:var(--font-display)] italic mb-2"
                  style={{ color: P.muted, fontSize: "0.95rem", lineHeight: 1.5 }}
                >
                  An enquiry into medicine
                </p>
                <p
                  className="font-[family-name:var(--font-display)] italic mb-10"
                  style={{ color: P.muted, fontSize: "0.95rem", lineHeight: 1.5 }}
                >
                  taken at one&apos;s own pace
                </p>

                <p
                  className="font-[family-name:var(--font-display)] italic"
                  style={{
                    color: P.inkRose,
                    fontSize: "0.62rem",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    fontVariantCaps: "all-small-caps",
                  }}
                >
                  By Appointment
                </p>
                <p
                  className="font-[family-name:var(--font-display)] italic mt-1"
                  style={{
                    color: P.muted,
                    fontSize: "0.62rem",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    fontVariantCaps: "all-small-caps",
                  }}
                >
                  Across Australia
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ─── Dispatches ───
   A curated reading list of official Australian regulatory
   guidance and legal analysis. Rendered as an editorial
   broadsheet table — hairline rules, roman numerals, italic
   titles, small-caps dates. The title *is* the link.

   The homepage shows three featured entries, each opening the
   source in a new tab. A quiet footer link leads to the full
   reading list at /news. No colour-coded category badges, no
   card hover tricks, no "read more →" arrows. The whole point
   is that a considered reader wants to read the source.

   Linking verbatim to regulators and law-firm commentary is
   permitted under the TGA Code; see dispatches.ts for the
   full provenance and the tier-2 draft gate. */
function LickiesDispatches() {
  const featured = FEATURED_DISPATCHES.slice(0, 3);

  return (
    <section className="py-24 lg:py-32" style={{ background: P.pastelGold }}>
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <Eyebrow className="mb-6">Dispatches</Eyebrow>
            <h2
              className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-medium mb-6"
              style={{ color: P.charcoal, letterSpacing: "-0.02em" }}
            >
              Read the <Emph>source</Emph>
            </h2>
            <p
              className="max-w-xl mx-auto font-[family-name:var(--font-display)] italic"
              style={{ color: P.muted, fontSize: "1rem", lineHeight: 1.75 }}
            >
              A considered reading list of the regulatory guidance that binds Australian telehealth practice — drawn from the regulators themselves and from the country&apos;s leading health-law firms.
            </p>
            <div className="max-w-xs mx-auto mt-8">
              <Asterism />
            </div>
          </div>
        </ScrollReveal>

        {/* Editorial broadsheet table */}
        <ScrollRevealStagger className="flex flex-col" stagger={0.08}>
          {featured.map((article, i) => (
            <a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block py-8 sm:py-9 transition-opacity duration-300 hover:opacity-75"
              style={{
                borderTop: i === 0 ? `1px solid ${P.charcoal}22` : "none",
                borderBottom: `1px solid ${P.charcoal}22`,
              }}
            >
              <div className="flex items-start gap-6 sm:gap-10">
                {/* Hanging roman numeral — the ornament */}
                <div className="flex-shrink-0 pt-1">
                  <Numeral n={i + 1} size="md" />
                </div>

                {/* Entry body */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
                    <span
                      className="font-[family-name:var(--font-display)] italic"
                      style={{
                        color: P.inkRose,
                        fontSize: "0.64rem",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        fontVariantCaps: "all-small-caps",
                      }}
                    >
                      {article.category === "Ahpra" ? "Ahpra" : article.category === "TGA" ? "The Regulator" : article.category === "Legal" ? "Counsel" : article.category === "Academic" ? "The Press" : "The Trade"}
                    </span>
                    {article.date && (
                      <>
                        <span style={{ color: `${P.charcoal}40` }} aria-hidden="true">
                          ·
                        </span>
                        <span
                          className="font-[family-name:var(--font-display)] italic"
                          style={{
                            color: P.muted,
                            fontSize: "0.64rem",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            fontVariantCaps: "all-small-caps",
                          }}
                        >
                          {article.date}
                        </span>
                      </>
                    )}
                  </div>
                  <h3
                    className="font-[family-name:var(--font-display)] italic mb-3 transition-colors"
                    style={{
                      color: P.charcoal,
                      fontSize: "clamp(1.15rem, 2vw, 1.55rem)",
                      lineHeight: 1.3,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {article.title}
                  </h3>
                  <p
                    className="font-[family-name:var(--font-display)] italic"
                    style={{
                      color: P.muted,
                      fontSize: "0.82rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {article.source}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </ScrollRevealStagger>

        {/* Quiet link to the full reading list */}
        <ScrollReveal delay={0.1}>
          <div className="text-center mt-12">
            <a
              href="/news"
              className="inline-flex items-center gap-3 font-[family-name:var(--font-display)] italic transition-opacity hover:opacity-70"
              style={{
                color: P.charcoal,
                fontSize: "0.72rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontVariantCaps: "all-small-caps",
              }}
            >
              <span className="h-px w-8" style={{ background: P.charcoal, opacity: 0.4 }} />
              The complete reading list
              <span className="h-px w-8" style={{ background: P.charcoal, opacity: 0.4 }} />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── FAQ — Marginalia ───
   Editorial index of common questions. Roman numerals hang in the
   margin like footnote markers in a printed book. */
const faqs = [
  { q: "Who conducts the consultations?", a: "Consultations are conducted by Australian-registered medical practitioners holding current Ahpra registration." },
  { q: "What does it cost?", a: "The pre-screening call with a qualified nurse is free. Doctor consultation fees are disclosed in full before any appointment is confirmed." },
  { q: "Will I receive a prescription?", a: "That is not something we can promise. The outcome of any consultation is determined by your doctor, following a proper clinical assessment." },
  { q: "Is it covered by Medicare or private health?", a: "At present, consultations are not covered by Medicare or most private health insurers. Costs are always disclosed before an appointment is booked." },
  { q: "How long does the process take?", a: "Most patients are seen within one week. Pre-screening calls are ordinarily scheduled within one business day." },
  { q: "Is everything conducted via telehealth?", a: "Yes. Under Australian law, telehealth consultations are equivalent to in-person consultations, conducted via secure video or phone." },
];

function LickiesFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-24 lg:py-32" style={{ background: P.pastelGreen }}>
      <div className="max-w-3xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <Eyebrow className="mb-6">Marginalia</Eyebrow>
            <h2
              className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-medium"
              style={{ color: P.charcoal }}
            >
              Questions, <Emph>commonly asked</Emph>
            </h2>
            <div className="max-w-xs mx-auto mt-8">
              <Asterism />
            </div>
          </div>
        </ScrollReveal>
        {faqs.map((f, i) => (
          <ScrollReveal key={i} delay={i * 0.04}>
            <div
              className="relative"
              style={{ borderBottom: `1px solid ${P.charcoal}20` }}
            >
              {/* Hanging numeral marginalia — lg+ only, where the
                  viewport is wide enough to keep the absolute-positioned
                  numeral inside the visible area. At sm and md the
                  inline fallback below is used instead. */}
              <span
                className="hidden lg:block absolute font-[family-name:var(--font-display)] italic"
                style={{
                  top: "1.55rem",
                  left: "-3.8rem",
                  color: P.inkRose,
                  fontSize: "0.92rem",
                  letterSpacing: "0.04em",
                  opacity: 0.85,
                }}
                aria-hidden="true"
              >
                <span style={{ fontSize: "0.64em", marginRight: "0.15em", opacity: 0.8 }}>№</span>
                {ROMAN[i]}
              </span>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center py-6 text-left"
              >
                <span className="flex items-baseline gap-3 pr-4">
                  <span
                    className="lg:hidden font-[family-name:var(--font-display)] italic"
                    style={{
                      color: P.inkRose,
                      fontSize: "0.78rem",
                      letterSpacing: "0.04em",
                      opacity: 0.85,
                    }}
                    aria-hidden="true"
                  >
                    <span style={{ fontSize: "0.72em", marginRight: "0.12em" }}>№</span>
                    {ROMAN[i]}
                  </span>
                  <span
                    className="font-[family-name:var(--font-display)]"
                    style={{
                      color: P.charcoal,
                      fontSize: "1.15rem",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {f.q}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
                  style={{ color: P.muted }}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-60 pb-6" : "max-h-0"}`}
              >
                <p
                  className="leading-[1.8] font-[family-name:var(--font-display)] italic"
                  style={{ color: P.muted, fontSize: "1rem" }}
                >
                  {f.a}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA — The Invitation ───
   A moment of dark contrast: charcoal field, ivory type, a single
   asterism, restrained phone lockup. No floating shapes, no lime. */
function LickiesCTA() {
  return (
    <section className="py-28 lg:py-40 relative overflow-hidden" style={{ background: P.charcoal }}>
      {/* Single hairline circle on the right — quiet, not parallax */}
      <HairlineCircle
        color={P.amberDeep}
        className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[60vmin] h-[60vmin] opacity-[0.18] pointer-events-none"
      />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <ScrollReveal>
          <p
            className="font-[family-name:var(--font-display)] italic mb-10"
            style={{
              color: P.ivoryWarm,
              fontSize: "0.72rem",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
              opacity: 0.7,
            }}
          >
            An Invitation
          </p>

          <h2
            className="font-[family-name:var(--font-display)] text-4xl lg:text-6xl font-medium mb-10 leading-[1.05]"
            style={{ color: P.ivory, letterSpacing: "-0.02em" }}
          >
            Should you like to speak,
            <br />
            <span style={{ color: P.ivoryWarm, fontStyle: "italic" }}>
              <span className="relative inline-block">
                we are listening
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0"
                  style={{
                    bottom: "0.04em",
                    height: "1px",
                    background: P.inkRose,
                    opacity: 0.9,
                  }}
                />
              </span>
              .
            </span>
          </h2>

          {/* Asterism on dark ground */}
          <div className="flex items-center justify-center gap-5 max-w-[18rem] mx-auto mb-12">
            <span className="flex-1 h-px" style={{ background: P.ivory, opacity: 0.22 }} />
            <span
              className="font-[family-name:var(--font-display)] leading-none"
              style={{ color: P.inkRose, fontSize: "1.2rem", opacity: 0.95 }}
              aria-hidden="true"
            >
              ⁂
            </span>
            <span className="flex-1 h-px" style={{ background: P.ivory, opacity: 0.22 }} />
          </div>

          <p
            className="text-lg mb-12 font-[family-name:var(--font-display)] italic max-w-lg mx-auto leading-[1.8]"
            style={{ color: "rgba(246,241,232,0.72)" }}
          >
            A confidential pre-screening call, at no cost, without obligation. Book a time that suits you — or speak with us directly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#booking"
              className="inline-flex items-center gap-3 px-10 py-5 font-[family-name:var(--font-display)] italic whitespace-nowrap"
              style={{
                background: P.pink,
                color: P.white,
                borderRadius: 0,
                fontSize: "0.82rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Book a Quiet Hour <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="tel:1800000000"
              className="inline-flex items-center gap-2 px-10 py-5 font-[family-name:var(--font-display)] italic whitespace-nowrap"
              style={{
                border: `1px solid rgba(246,241,232,0.3)`,
                color: "rgba(246,241,232,0.85)",
                borderRadius: 0,
                fontSize: "0.82rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              <Phone className="w-3.5 h-3.5" /> 1800 000 000
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Footer — The Colophon ───
   Quiet Hours as the sole visual identity. Golden Ratio Clinics
   appears only as the required legal credit at the very bottom,
   italicised and in fine print, the way a book's publisher is named
   on the copyright page. */
function LickiesFooter() {
  const yr = new Date().getFullYear();

  const footerLinkStyle: React.CSSProperties = {
    color: "rgba(246, 241, 232, 0.68)",
    fontSize: "0.92rem",
    fontFamily: "var(--font-display), serif",
    fontStyle: "italic",
    letterSpacing: "0.005em",
  };

  const columnHeadingStyle: React.CSSProperties = {
    color: P.ivory,
    fontSize: "0.66rem",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    fontVariantCaps: "all-small-caps",
    fontFamily: "var(--font-display), serif",
    fontStyle: "italic",
    marginBottom: "1.25rem",
  };

  return (
    <footer style={{ background: P.charcoal, color: "rgba(246,241,232,0.7)" }}>
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-14">
        {/* Quiet Hours wordmark — centered, editorial */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="h-px w-14" style={{ background: P.ivory, opacity: 0.25 }} />
            <span
              className="font-[family-name:var(--font-display)] leading-none"
              style={{ color: P.inkRose, fontSize: "1.2rem" }}
              aria-hidden="true"
            >
              ⁂
            </span>
            <span className="h-px w-14" style={{ background: P.ivory, opacity: 0.25 }} />
          </div>
          <p
            className="font-[family-name:var(--font-display)] italic"
            style={{
              color: P.ivory,
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              letterSpacing: "0.02em",
              lineHeight: 1,
              fontWeight: 500,
            }}
          >
            Quiet Hours
          </p>
          <p
            className="mt-4 font-[family-name:var(--font-display)] italic"
            style={{
              color: "rgba(246,241,232,0.55)",
              fontSize: "0.72rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
            }}
          >
            An enquiry into medicine, taken at one&apos;s own pace
          </p>
        </div>

        <div className="h-px w-full mb-14" style={{ background: "rgba(246,241,232,0.12)" }} />

        <div className="grid md:grid-cols-3 gap-12 mb-14">
          <div>
            <h4 style={columnHeadingStyle}>Sections</h4>
            <nav className="space-y-2.5">
              {[
                { l: "The Itinerary", h: "#process" },
                { l: "The Principles", h: "#services" },
                { l: "An Enquiry", h: "#quiz" },
                { l: "On the House", h: "#about" },
                { l: "Marginalia", h: "#faq" },
                { l: "The Pre-Screening", h: "#booking" },
              ].map((item) => (
                <a
                  key={item.l}
                  href={item.h}
                  className="block hover:opacity-100 transition-opacity"
                  style={footerLinkStyle}
                >
                  {item.l}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h4 style={columnHeadingStyle}>Correspondence</h4>
            <div className="space-y-3">
              <a
                href="tel:1800000000"
                className="flex items-center gap-2.5 hover:opacity-100 transition-opacity"
                style={footerLinkStyle}
              >
                <Phone className="w-3.5 h-3.5" /> 1800 000 000
              </a>
              <a
                href="mailto:hello@quiethours.com.au"
                className="flex items-center gap-2.5 hover:opacity-100 transition-opacity"
                style={footerLinkStyle}
              >
                <Mail className="w-3.5 h-3.5" /> hello@quiethours.com.au
              </a>
              <div className="flex items-center gap-2.5" style={footerLinkStyle}>
                <MapPin className="w-3.5 h-3.5" /> Across Australia
              </div>
            </div>
          </div>

          <div>
            <h4 style={columnHeadingStyle}>Particulars</h4>
            <nav className="space-y-2.5">
              <a href="/privacy" className="block hover:opacity-100 transition-opacity" style={footerLinkStyle}>
                Privacy
              </a>
              <a href="/terms" className="block hover:opacity-100 transition-opacity" style={footerLinkStyle}>
                Terms
              </a>
              <a href="/complaints" className="block hover:opacity-100 transition-opacity" style={footerLinkStyle}>
                Complaints
              </a>
              <a href="/news" className="block hover:opacity-100 transition-opacity" style={footerLinkStyle}>
                Policy &amp; Law
              </a>
            </nav>
          </div>
        </div>
      </div>

      {/* Colophon strip — the only place Golden Ratio Clinics appears,
          as the required regulatory credit, in fine italic print. */}
      <div style={{ borderTop: "1px solid rgba(246,241,232,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p
            className="text-center max-w-3xl mx-auto font-[family-name:var(--font-display)] italic leading-[1.9]"
            style={{ color: "rgba(246,241,232,0.42)", fontSize: "0.72rem" }}
          >
            An enquiry service operated by a regulated Australian telehealth
            medical practice, in accordance with Australian therapeutic goods
            law and Ahpra prescribing guidance. All clinical decisions are
            made by your doctor during your consultation. Information on this
            page is general in nature and is not medical advice.
          </p>
          <p
            className="text-center mt-5 font-[family-name:var(--font-display)] italic"
            style={{
              color: "rgba(246,241,232,0.3)",
              fontSize: "0.62rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
            }}
          >
            &copy; {yr} Quiet Hours &nbsp;·&nbsp; All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════ */

export default function QuietHoursPage() {
  return (
    <SmoothScroll>
      <LickiesNav />
      <main>
        <LickiesHero />
        <LickiesProcess />
        <LickiesServices />
        <LickiesQuiz />
        <LickiesBooking />
        <LickiesAbout />
        <LickiesDispatches />
        <LickiesFAQ />
        <LickiesCTA />
      </main>
      <LickiesFooter />
    </SmoothScroll>
  );
}
