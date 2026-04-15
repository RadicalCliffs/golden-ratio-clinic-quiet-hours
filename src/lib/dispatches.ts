/**
 * Dispatches — the Quiet Hours reading list.
 *
 * A curated index of official Australian regulatory guidance and
 * legal analysis on therapeutic goods advertising, telehealth
 * practice, and Ahpra prescribing standards. Linking verbatim to
 * regulatory publications and law-firm commentary is permitted
 * under the TGA Code — it does not constitute advertising of any
 * specific therapeutic good or service.
 *
 * The `published` flag exists only as a "has a verified source URL
 * yet" gate — not a compliance requirement. Consumers import
 * `PUBLISHED_DISPATCHES` (or `FEATURED_DISPATCHES`) so that any
 * half-finished entries cannot accidentally render.
 *
 * Rendering surfaces:
 *   - /news — the full Dispatches reading list, grouped by category
 *   - / (homepage Quiet Hours funnel) — three featured entries in
 *     an editorial broadsheet section between About and FAQ
 */

export type DispatchCategory = "TGA" | "Ahpra" | "Legal" | "Academic" | "Industry";

export type Dispatch = {
  title: string;
  source: string;
  url: string;
  category: DispatchCategory;
  excerpt?: string;
  /** Approximate editorial date for Dispatches display, e.g. "2023" or "Dec 2023". */
  date?: string;
  featured?: boolean;
  /**
   * Simple render gate — `false` means "this entry isn't ready to
   * render yet" (e.g. awaiting a verified source URL). Render code
   * must filter on this.
   */
  published: boolean;
  /** Editorial note — never rendered. */
  note?: string;
};

export const DISPATCHES: Dispatch[] = [
  // ═══════════════════════════════════════════════════════════════
  // FEATURED — the three entries promoted to the homepage
  // Dispatches section. Chosen as the strongest editorial mix for
  // a reader doing their own due diligence: the regulator's most
  // specific 2025 enforcement action, Ahpra's most pointed 2025
  // critique of problematic online prescribing models, and the
  // accessible investigative press piece.
  // ═══════════════════════════════════════════════════════════════
  {
    title:
      "Dispensed Pty Ltd issued infringement notices and directed to cease alleged unlawful advertising of medicinal cannabis",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/news/media-releases/dispensed-pty-ltd-issued-infringement-notices-and-directed-cease-alleged-unlawful-advertising-medicinal-cannabis",
    category: "TGA",
    date: "Sep 2025",
    excerpt:
      "Six infringement notices totalling $118,800 issued over indirect advertising on third-party sites and social media — including the use of terms such as 'plant medicine' and 'cannabinoid-based therapies', which the TGA treats as synonymous with medicinal cannabis.",
    featured: true,
    published: true,
  },
  {
    title:
      "Guidance on medicinal cannabis prescribing targets unsafe practice",
    source: "Australian Health Practitioner Regulation Agency",
    url: "https://www.ahpra.gov.au/News/2025-07-09-Medicinal-cannabis-guidance.aspx",
    category: "Ahpra",
    date: "Jul 2025",
    excerpt:
      "Ahpra and the National Boards issue direct guidance criticising online questionnaire-based cannabis prescribing, single-product clinics, and any model that skips a real-time consultation with a practitioner before a script is written.",
    featured: true,
    published: true,
  },
  {
    title: "This medicinal cannabis website bends the rules. Take our quiz",
    source: "The Conversation",
    url: "https://theconversation.com/this-medicinal-cannabis-website-bends-the-rules-take-our-quiz-to-see-why-270685",
    category: "Academic",
    date: "2025",
    excerpt:
      "Academic analysis of how Australian telehealth sites indirectly promote therapeutic goods and the compliance lines they routinely cross.",
    featured: true,
    published: true,
  },

  // ── The Regulator (TGA) ─────────────────────────────────────
  {
    title: "Advertising medicinal cannabis products is prohibited",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/resources/guidance/advertising-medicinal-cannabis-products-prohibited",
    category: "TGA",
    date: "2023",
    excerpt:
      "Official TGA guidance on prohibited advertising of prescription-only medicines, including the reasonable-consumer test and examples of indirect promotion.",
    published: true,
  },
  {
    title: "Advertising a health service — what you can and cannot do",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/resources/guidance/advertising-health-service",
    category: "TGA",
    date: "2023",
    published: true,
  },
  {
    title: "Reminder: supply and advertising controls on medicinal cannabis",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/news/news-articles/reminder-supply-and-advertising-controls-medicinal-cannabis",
    category: "TGA",
    date: "2023",
    published: true,
  },
  {
    title: "What can and cannot be advertised to the general public",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/products/regulations-all-products/advertising/advertising-basics/what-can-and-cannot-be-advertised-general-public",
    category: "TGA",
    date: "2024",
    published: true,
  },
  {
    title: "Updated medicinal cannabis guidance",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/news/media-releases/updated-medicinal-cannabis-guidance",
    category: "TGA",
    date: "2023",
    published: true,
  },
  {
    title:
      "Advertising guidance for businesses dealing with medicinal cannabis (PDF)",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/sites/default/files/2023-12/advertising-guidance-businesses-medicinal-cannabis-products.pdf",
    category: "TGA",
    date: "Dec 2023",
    published: true,
  },

  // ── Government updates on ingestible therapeutic goods ──────
  // TGA posture toward unapproved medicinal cannabis products,
  // including edible / ingestible dose forms (gummies,
  // confectionery) and the quality standards that govern them.
  {
    title:
      "Planned consultation to address growing safety concerns of unapproved medicinal cannabis products in Australia",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/news/news-articles/planned-consultation-address-growing-safety-concerns-unapproved-medicinal-cannabis-products-australia",
    category: "TGA",
    date: "Aug 2025",
    excerpt:
      "The TGA announces a public consultation prompted by increasing concern over the safety of unapproved medicinal cannabis products — including ingestible dose forms and those containing higher levels of THC.",
    published: true,
  },
  {
    title:
      "All medicinal cannabis products supplied to Australian patients must meet quality standards",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/news/media-releases/all-medicinal-cannabis-products-supplied-australian-patients-must-meet-quality-standards",
    category: "TGA",
    date: "2025",
    excerpt:
      "A media release reaffirming that every medicinal cannabis product supplied in Australia — whether manufactured domestically or imported, and regardless of dose form — must comply with Therapeutic Goods Order 93 (TGO 93).",
    published: true,
  },
  {
    title: "Complying with the quality requirements for medicinal cannabis",
    source: "Therapeutic Goods Administration",
    url: "https://www.tga.gov.au/resources/guidance/complying-quality-requirements-medicinal-cannabis",
    category: "TGA",
    date: "2024",
    excerpt:
      "Guidance on TGO 93, covering dose-form quality, testing, labelling, manufacturing requirements, and the child-resistant packaging obligations that apply to ingestible formats.",
    published: true,
  },

  // ── Ahpra ───────────────────────────────────────────────────
  // The Ahpra 2025 telehealth and medicinal cannabis pass: three
  // distinct publications across July, September, and October,
  // each firming up the Board's position on considered practice
  // versus questionnaire-driven online prescribing.
  {
    title:
      "Guidance on medicinal cannabis prescribing targets unsafe supply",
    source: "Australian Health Practitioner Regulation Agency",
    url: "https://www.ahpra.gov.au/News/2025-09-23-Medicinal-cannabis-guidance.aspx",
    category: "Ahpra",
    date: "Sep 2025",
    excerpt:
      "Ahpra's follow-up statement sharpening its focus on supply-side concerns — unsafe dispensing pathways, single-product prescribing models, and the supply chain behind them.",
    published: true,
  },
  {
    title: "Patient safety paramount in updated telehealth guidance",
    source: "Australian Health Practitioner Regulation Agency",
    url: "https://www.ahpra.gov.au/News/2025-10-07-Updated-telehealth-guidance.aspx",
    category: "Ahpra",
    date: "Oct 2025",
    excerpt:
      "Ahpra records 586 telehealth-related notifications in 2024–25 and updates its guidance accordingly. Prescribing on the basis of a text, email, or online questionnaire — without a real-time consultation — is identified as poor practice.",
    published: true,
  },
  {
    title: "Medicinal cannabis prescribing guidance",
    source: "Australian Health Practitioner Regulation Agency",
    url: "https://www.ahpra.gov.au/Resources/Medicinal-cannabis-prescribing.aspx",
    category: "Ahpra",
    date: "2023",
    excerpt:
      "The foundational Ahpra guidance for prescribers outlining obligations around patient assessment, advertising, and clinical decision-making.",
    published: true,
  },

  // ── Counsel — legal analysis ─────────────────────────────────
  {
    title: "Ahpra publishes cannabis prescriber guidance",
    source: "MinterEllison",
    url: "https://www.minterellison.com/articles/ahpra-publishes-cannabis-prescriber-guidance",
    category: "Legal",
    date: "2023",
    published: true,
  },
  {
    title:
      "Regulators crack down on therapeutic goods advertising: TGA, ACCC and Ahpra actions",
    source: "MinterEllison",
    url: "https://www.minterellison.com/articles/unlawful-pharma-and-health-service-advertising-in-regulators-sights",
    category: "Legal",
    date: "2024",
    published: true,
  },
  {
    title:
      "Breaking down the dose: understanding the laws regulating advertising medicines in Australia",
    source: "Maddocks",
    url: "https://www.maddocks.com.au/insights/breaking-down-the-dose-understanding-the-laws-regulating-advertising-medicines-in-australia",
    category: "Legal",
    date: "2024",
    published: true,
  },
  {
    title: "TGA Regulations and Medicinal Cannabis Advertisement",
    source: "HWL Ebsworth Lawyers",
    url: "https://hwlebsworth.com.au/tga-regulations-and-medicinal-cannabis-advertisement/",
    category: "Legal",
    date: "2023",
    published: true,
  },
  {
    title: "Prescribing medicinal cannabis: be aware of the medico-legal risks",
    source: "Avant Mutual",
    url: "https://avant.org.au/resources/prescribing-medicinal-cannabis-be-aware-of-the-medico-legal-risks",
    category: "Legal",
    date: "2023",
    published: true,
  },
  {
    title: "Updated guidelines for the prescribing of medicinal cannabis",
    source: "Panetta McGrath Lawyers",
    url: "https://www.pmlawyers.com.au/blog/2025/09/health-blog/updated-guidelines-for-the-prescribing-of-medicinal-cannabis/",
    category: "Legal",
    date: "Sep 2025",
    excerpt:
      "Health-law commentary on Ahpra's 2025 guideline update, including how the regulator now expects prescribers to treat telehealth-first cannabis models.",
    published: true,
  },

  // ── The Press / The Trade ───────────────────────────────────
  {
    title: "TGA advertising and medical cannabis enforcement — top 10 trends",
    source: "Meridian Lawyers (MCW)",
    url: "https://www.mcw.com.au/tga-advertising-and-medical-cannabis-enforcement-activity-top-10-trends/",
    category: "Industry",
    date: "2024",
    published: true,
  },
  {
    title:
      "Asia-Pacific Roundup: TGA guidance clarifies medicinal cannabis advertising rules",
    source: "Regulatory Affairs Professionals Society (RAPS)",
    url: "https://www.raps.org/news-and-articles/news-articles/2024/1/asia-pacific-roundup-tga-guidance-clarifies-medici",
    category: "Industry",
    date: "Jan 2024",
    published: true,
  },
];

/**
 * Published dispatches only — safe to render. The `published` gate
 * is a belt-and-braces check against half-finished entries; every
 * current row has `published: true` but consumers should still
 * import this filtered view rather than `DISPATCHES` directly.
 */
export const PUBLISHED_DISPATCHES = DISPATCHES.filter((d) => d.published);

/** Three featured entries for the homepage Dispatches section. */
export const FEATURED_DISPATCHES = PUBLISHED_DISPATCHES.filter((d) => d.featured);
