import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, ArrowLeft } from "lucide-react";
import {
  PUBLISHED_DISPATCHES,
  type Dispatch,
  type DispatchCategory,
} from "@/lib/dispatches";

/**
 * Dispatches — the full Quiet Hours reading list.
 *
 * A curated index of official Australian regulatory guidance and
 * legal analysis on therapeutic goods advertising, telehealth
 * practice, and Ahpra prescribing standards. Articles are linked
 * verbatim to their original publishers.
 *
 * Linking to and quoting official regulatory sources is permitted
 * under the TGA Code — it does not constitute advertising of any
 * specific therapeutic good or service. The page exists to inform
 * visitors about the legal framework that governs Australian
 * telehealth medical practice.
 *
 * This page is also a quiet SEO asset — it ranks for compliance
 * queries that less-careful competitors cannot touch, and it
 * establishes Quiet Hours as a considered reader of the
 * regulatory literature.
 *
 * Half-finished entries (if any) are filtered out at the data
 * source — this file imports `PUBLISHED_DISPATCHES`, not `DISPATCHES`.
 */

export const metadata: Metadata = {
  title: "Dispatches — Quiet Hours",
  description:
    "A considered reading list of official Australian regulatory guidance and legal analysis on therapeutic goods advertising, telehealth practice, and Ahpra prescribing standards. Drawn from the TGA, Ahpra, and the country's leading health-law firms.",
  keywords: [
    "TGA regulations Australia",
    "Ahpra telehealth compliance",
    "therapeutic goods advertising law",
    "Australian medical practitioner registration",
    "telehealth regulatory compliance",
    "Ahpra prescribing guidance",
    "TGA Special Access Scheme",
    "Australian health law updates",
    "Quiet Hours",
  ],
  openGraph: {
    title: "Dispatches — Quiet Hours",
    description:
      "A considered reading list of regulatory guidance from the TGA, Ahpra, and Australia's leading health-law firms.",
    type: "article",
    locale: "en_AU",
  },
  alternates: {
    canonical: "/news",
  },
};

/* ─── Palette ─── */
const P = {
  charcoal: "#2A2822",
  ivory: "#F6F1E8",
  ivoryWarm: "#F0EADC",
  pastelGold: "#ECE0C3",
  muted: "#6B6558",
  inkRose: "#A85C6B",
  border: "#E4DCC8",
};

/* ─── Editorial category labels (Quiet Hours voice) ─── */
const CATEGORY_LABEL: Record<DispatchCategory, string> = {
  TGA: "The Regulator",
  Ahpra: "Ahpra",
  Legal: "Counsel",
  Academic: "The Press",
  Industry: "The Trade",
};

/* ─── Category display order for grouping ─── */
const CATEGORY_ORDER: DispatchCategory[] = [
  "TGA",
  "Ahpra",
  "Legal",
  "Academic",
  "Industry",
];

/* Group published articles by category, preserving entry order. */
function groupArticles(articles: Dispatch[]): Record<DispatchCategory, Dispatch[]> {
  const groups = {
    TGA: [] as Dispatch[],
    Ahpra: [] as Dispatch[],
    Legal: [] as Dispatch[],
    Academic: [] as Dispatch[],
    Industry: [] as Dispatch[],
  };
  for (const a of articles) groups[a.category].push(a);
  return groups;
}

/* Roman numerals for editorial index markers */
const ROMAN = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
];

export default function NewsPage() {
  const groups = groupArticles(PUBLISHED_DISPATCHES);
  let runningIndex = 0; // global roman numeral counter across groups

  return (
    <main
      className="min-h-screen"
      style={{ background: P.ivory, color: P.charcoal }}
    >
      {/* ─── Header ─── */}
      <header style={{ borderBottom: `1px solid ${P.border}` }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-60 font-[family-name:var(--font-display)] italic flex-shrink-0"
            style={{
              color: P.charcoal,
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
            }}
            aria-label="Return to Quiet Hours"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {/* Full label hides below sm so the header fits on narrow
                phones — the arrow + aria-label remain for orientation. */}
            <span className="hidden sm:inline">Return to Quiet Hours</span>
          </Link>
          <div className="flex items-center gap-2.5 flex-shrink min-w-0">
            <span
              className="font-[family-name:var(--font-display)] leading-none"
              style={{ color: P.inkRose, fontSize: "1rem", opacity: 0.85 }}
              aria-hidden="true"
            >
              ⁂
            </span>
            <span
              className="font-[family-name:var(--font-display)] italic whitespace-nowrap"
              style={{
                color: P.charcoal,
                fontSize: "1.05rem",
                letterSpacing: "0.02em",
                fontWeight: 500,
              }}
            >
              Quiet Hours
            </span>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 pt-24 pb-16 text-center">
        {/* Editorial eyebrow */}
        <div
          className="inline-flex items-center justify-center gap-3 mb-8"
          style={{ color: P.charcoal }}
        >
          <span className="h-px w-8" style={{ background: P.charcoal, opacity: 0.45 }} />
          <span
            className="font-[family-name:var(--font-display)] italic"
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
              fontWeight: 400,
            }}
          >
            Dispatches
          </span>
          <span className="h-px w-8" style={{ background: P.charcoal, opacity: 0.45 }} />
        </div>

        <h1
          className="font-[family-name:var(--font-display)] font-medium leading-[1.02] mb-10 break-words"
          style={{
            color: P.charcoal,
            fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
            letterSpacing: "-0.025em",
          }}
        >
          Regulatory guidance,
          <br />
          <span className="relative inline-block">
            <em style={{ fontStyle: "italic", color: P.inkRose }}>read the source</em>
            <span
              aria-hidden="true"
              className="absolute left-0 right-0"
              style={{
                bottom: "0.04em",
                height: "1px",
                background: P.inkRose,
                opacity: 0.7,
              }}
            />
          </span>
        </h1>

        {/* Asterism */}
        <div className="flex items-center justify-center gap-5 max-w-[16rem] mx-auto mb-10">
          <span className="flex-1 h-px" style={{ background: P.charcoal, opacity: 0.22 }} />
          <span
            className="font-[family-name:var(--font-display)] leading-none"
            style={{ color: P.inkRose, fontSize: "1.15rem", opacity: 0.9 }}
            aria-hidden="true"
          >
            ⁂
          </span>
          <span className="flex-1 h-px" style={{ background: P.charcoal, opacity: 0.22 }} />
        </div>

        <p
          className="max-w-2xl mx-auto font-[family-name:var(--font-display)] italic mb-5"
          style={{
            color: P.muted,
            fontSize: "1.1rem",
            lineHeight: 1.8,
          }}
        >
          A curated reading list of official regulatory guidance and legal analysis on telehealth medical practice, therapeutic goods advertising law, and Ahpra prescribing standards in Australia. Drawn from the regulators themselves and from the country&rsquo;s leading health-law firms.
        </p>
        <p
          className="max-w-2xl mx-auto font-[family-name:var(--font-display)] italic"
          style={{
            color: P.muted,
            fontSize: "0.92rem",
            lineHeight: 1.8,
            opacity: 0.85,
          }}
        >
          Each entry below links verbatim to its original publisher. Quiet Hours offers no editorial opinion on the content — these pages are reproduced here because we believe readers are entitled to read the same regulatory guidance that binds their healthcare providers.
        </p>
      </section>

      {/* ─── Article groups — editorial broadsheet ─── */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 pb-24">
        {CATEGORY_ORDER.map((category) => {
          const entries = groups[category];
          if (entries.length === 0) return null;

          return (
            <div key={category} className="mb-20 last:mb-0">
              {/* Group heading — small caps with hairlines */}
              <div className="flex items-center gap-5 mb-10">
                <span
                  className="font-[family-name:var(--font-display)] italic whitespace-nowrap"
                  style={{
                    color: P.charcoal,
                    fontSize: "0.78rem",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    fontVariantCaps: "all-small-caps",
                  }}
                >
                  {CATEGORY_LABEL[category]}
                </span>
                <span className="flex-1 h-px" style={{ background: P.charcoal, opacity: 0.3 }} />
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
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Entries */}
              <div className="flex flex-col">
                {entries.map((article, idx) => {
                  const thisIndex = runningIndex++;
                  const hostname = (() => {
                    try {
                      return new URL(article.url).hostname.replace(/^www\./, "");
                    } catch {
                      return "";
                    }
                  })();
                  return (
                    <a
                      key={article.url}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block py-7 transition-opacity duration-300 hover:opacity-75"
                      style={{
                        borderTop: idx === 0 ? `1px solid ${P.charcoal}22` : "none",
                        borderBottom: `1px solid ${P.charcoal}22`,
                      }}
                    >
                      <div className="flex items-start gap-6 sm:gap-8">
                        {/* Hanging roman numeral */}
                        <span
                          className="flex-shrink-0 font-[family-name:var(--font-display)] italic pt-0.5"
                          style={{
                            color: P.inkRose,
                            fontSize: "1.25rem",
                            letterSpacing: "0.04em",
                            minWidth: "3.5rem",
                          }}
                          aria-hidden="true"
                        >
                          <span style={{ fontSize: "0.62em", marginRight: "0.15em", opacity: 0.8 }}>
                            №
                          </span>
                          {ROMAN[thisIndex] ?? thisIndex + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
                            <span
                              className="font-[family-name:var(--font-display)] italic"
                              style={{
                                color: P.muted,
                                fontSize: "0.78rem",
                                letterSpacing: "0.02em",
                              }}
                            >
                              {article.source}
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
                          <h2
                            className="font-[family-name:var(--font-display)] italic mb-3"
                            style={{
                              color: P.charcoal,
                              fontSize: "clamp(1.2rem, 2.1vw, 1.55rem)",
                              lineHeight: 1.3,
                              letterSpacing: "-0.005em",
                            }}
                          >
                            {article.title}
                          </h2>
                          {article.excerpt && (
                            <p
                              className="font-[family-name:var(--font-display)] italic mb-3"
                              style={{
                                color: P.muted,
                                fontSize: "0.95rem",
                                lineHeight: 1.7,
                              }}
                            >
                              {article.excerpt}
                            </p>
                          )}
                          {hostname && (
                            <div
                              className="flex items-center gap-1.5 font-[family-name:var(--font-display)] italic"
                              style={{
                                color: P.muted,
                                fontSize: "0.7rem",
                                letterSpacing: "0.08em",
                                opacity: 0.75,
                              }}
                            >
                              <span className="truncate">{hostname}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Editorial footer note — rewritten in Quiet Hours voice */}
        <div
          className="mt-20 px-8 py-10 max-w-3xl mx-auto"
          style={{
            background: P.ivoryWarm,
            border: `1px solid ${P.border}`,
          }}
        >
          <p
            className="font-[family-name:var(--font-display)] italic leading-[1.9] mb-4"
            style={{ color: P.charcoal, fontSize: "0.95rem" }}
          >
            <span
              style={{
                color: P.inkRose,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontVariantCaps: "all-small-caps",
                fontSize: "0.78rem",
              }}
            >
              On this reading list
            </span>
          </p>
          <p
            className="font-[family-name:var(--font-display)] italic leading-[1.9]"
            style={{ color: P.muted, fontSize: "0.92rem" }}
          >
            The entries above are linked verbatim to their original publishers and are reproduced here as-is. Quiet Hours offers no editorial opinion on their content. We feature them because we believe readers are entitled to read the same regulatory guidance that their healthcare providers are bound by. If you would like to understand the legal framework that governs telehealth medical practice in Australia, we encourage you to read the official sources directly.
          </p>
        </div>
      </section>

      {/* ─── Colophon footer ─── */}
      <footer style={{ borderTop: `1px solid ${P.border}` }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-px w-10" style={{ background: P.charcoal, opacity: 0.3 }} />
            <span
              className="font-[family-name:var(--font-display)] leading-none"
              style={{ color: P.inkRose, fontSize: "1rem", opacity: 0.85 }}
              aria-hidden="true"
            >
              ⁂
            </span>
            <span className="h-px w-10" style={{ background: P.charcoal, opacity: 0.3 }} />
          </div>
          <p
            className="text-center font-[family-name:var(--font-display)] italic"
            style={{
              color: P.muted,
              fontSize: "0.62rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps",
            }}
          >
            &copy; {new Date().getFullYear()} Quiet Hours &nbsp;·&nbsp;{" "}
            <Link href="/" className="hover:opacity-60 transition-opacity underline-offset-4 hover:underline">
              Return to the enquiry
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
