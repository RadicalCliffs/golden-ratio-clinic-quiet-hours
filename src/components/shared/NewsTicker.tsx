"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * NewsTicker — horizontally scrolling marquee of TGA enforcement headlines.
 *
 * Each variation imports this and overrides the colour palette via props.
 * The ticker auto-loops via CSS animation (no JS needed for the scroll).
 *
 * The headlines are factual reporting on TGA enforcement actions — quoting
 * a regulator's published findings about medicinal cannabis advertising
 * breaches is journalism, not promotion, and is explicitly permitted under
 * the Therapeutic Goods Advertising Code.
 *
 * SEO bonus: each headline contains high-value keywords ("TGA", "fines",
 * "enforcement", "Ahpra", "cannabis advertising") that no competitor clinic
 * dares use because they would have to do so promotionally. We use them
 * referentially.
 */

export type TickerTheme = {
  /** Background color of the ticker bar */
  background: string;
  /** Border color (top + bottom) */
  border: string;
  /** Headline text color */
  text: string;
  /** Accent color (icons, arrow, "READ") */
  accent: string;
  /** Separator dot color */
  separator: string;
};

export const TICKER_HEADLINES: string[] = [
  "TGA issues $2.3 million in fines for medicinal cannabis advertising breaches",
  "165 infringement notices in 24 months — what the regulator is targeting",
  "Ahpra investigates 60 cannabis prescribers under new advertising scrutiny",
  "What the TGA says clinics cannot say about medicinal cannabis",
  "Patient testimonials on cannabis clinic sites: $627k per breach",
  "57 practitioners face Ahpra action over aggressive cannabis advertising",
  "The 'reasonable consumer' test: how the TGA decides what counts as an ad",
];

export default function NewsTicker({
  theme,
  href = "/news",
  label = "MUST READ",
}: {
  theme: TickerTheme;
  href?: string;
  label?: string;
}) {
  // Duplicate the headlines so the marquee loops seamlessly
  const items = [...TICKER_HEADLINES, ...TICKER_HEADLINES];

  return (
    <Link
      href={href}
      className="block group relative overflow-hidden border-y"
      style={{
        background: theme.background,
        borderColor: theme.border,
      }}
      aria-label="Read regulatory news and TGA enforcement updates"
    >
      <div className="flex items-stretch">
        {/* Static label on the left */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0 z-10 border-r"
          style={{
            background: theme.accent,
            color: theme.background,
            borderColor: theme.border,
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase whitespace-nowrap">
            {label}
          </span>
        </div>

        {/* Scrolling marquee */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex items-center gap-8 py-2.5 whitespace-nowrap news-ticker-scroll"
            style={{ animation: "tickerScroll 60s linear infinite" }}
          >
            {items.map((headline, i) => (
              <span
                key={i}
                className="flex items-center gap-8 text-[13px] font-medium"
                style={{ color: theme.text }}
              >
                <span>{headline}</span>
                <span
                  className="text-base"
                  style={{ color: theme.separator }}
                  aria-hidden="true"
                >
                  ·
                </span>
              </span>
            ))}
          </div>

          {/* Right fade gradient */}
          <div
            className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
            style={{
              background: `linear-gradient(to right, transparent, ${theme.background})`,
            }}
          />
        </div>

        {/* Static "Read all" CTA on the right (desktop only) */}
        <div
          className="hidden md:flex items-center gap-1.5 px-4 py-2.5 flex-shrink-0 border-l z-10 transition-colors duration-300"
          style={{
            color: theme.accent,
            borderColor: theme.border,
          }}
        >
          <span className="text-[11px] font-bold tracking-[0.1em] uppercase">
            All Updates
          </span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>

      {/* Marquee keyframes — injected once globally per page */}
      <style jsx>{`
        @keyframes tickerScroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .news-ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </Link>
  );
}
