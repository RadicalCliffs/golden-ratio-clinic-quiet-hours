/**
 * ICS (iCalendar) generator — RFC 5545 compliant.
 *
 * We intentionally don't pull in an external library for this. The
 * spec's quirks are well-defined and our usage is narrow (one VEVENT
 * per request), so a ~100-line hand-rolled generator is smaller,
 * auditable, and has zero supply-chain risk.
 *
 * ### Cross-calendar quirks worth knowing
 *
 * - **Line endings MUST be CRLF (`\r\n`).** Google Calendar is
 *   forgiving; Outlook / Apple Calendar will silently drop events
 *   that use bare LF.
 * - **Text fields must escape four characters**: backslash, semicolon,
 *   comma, and newline (as literal `\n`). If you forget any of these
 *   the parser will truncate the value at the unescaped delimiter.
 * - **UID must be globally unique and stable**. Using `<id>@domain`
 *   is the canonical form — if the user re-downloads the file after
 *   the appointment is edited, the new event REPLACES the old one in
 *   their calendar instead of creating a duplicate (as long as you
 *   also bump `SEQUENCE` and `DTSTAMP`).
 * - **Date-time must be in UTC** with the `Z` suffix:
 *   `YYYYMMDDTHHMMSSZ`. No dashes, no colons. Mixing local time
 *   zones across different parsers is a well-known foot-gun.
 * - **Lines must be folded at 75 octets** per the spec. Practically,
 *   Gmail/Apple Calendar don't care, but cleaner implementations
 *   like ThunderBird do reject over-long lines. We fold defensively.
 */

export type IcsEvent = {
  /**
   * Stable identifier for this event. Goes into the UID field as
   * `<uid>@goldenratioclinics.com.au`. MUST be stable across edits
   * so re-downloading the ICS updates the existing calendar entry
   * instead of creating a duplicate.
   */
  uid: string;
  /** Human-readable event title (SUMMARY). */
  title: string;
  /** Start of the event. Serialised to UTC `YYYYMMDDTHHMMSSZ`. */
  start: Date;
  /** End of the event. Serialised the same way. */
  end: Date;
  /** Longer description (DESCRIPTION). Newlines allowed. */
  description?: string;
  /** Physical address or virtual-meeting URL (LOCATION). */
  location?: string;
  /**
   * Event status. Defaults to `CONFIRMED`. Use `CANCELLED` to mark an
   * event as deleted — combined with a bumped SEQUENCE, this removes
   * it from the user's calendar.
   */
  status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  /**
   * Monotonic version counter. Increment this each time the event is
   * edited so calendar clients know to REPLACE rather than merge.
   * Defaults to 0.
   */
  sequence?: number;
  /** When the ICS file is being generated. Defaults to `new Date()`. */
  now?: Date;
};

const DOMAIN = "goldenratioclinics.com.au";
const PRODID = `-//Golden Ratio Clinics//Patient Portal//EN`;

/**
 * Build a valid .ics file body from a single event.
 *
 * The output always ends with CRLF and is safe to serve with
 * `Content-Type: text/calendar; charset=utf-8`.
 */
export function buildIcs(event: IcsEvent): string {
  const now = event.now ?? new Date();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}@${DOMAIN}`,
    `DTSTAMP:${formatUtc(now)}`,
    `DTSTART:${formatUtc(event.start)}`,
    `DTEND:${formatUtc(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }

  lines.push(`STATUS:${event.status ?? "CONFIRMED"}`);
  lines.push(`SEQUENCE:${event.sequence ?? 0}`);
  lines.push("TRANSP:OPAQUE");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  // Fold long lines, then join with CRLF. Trailing CRLF keeps strict
  // parsers (RFC-5545 §3.1) happy.
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/**
 * RFC 5545 §3.3.12 — text escape. Order matters: backslash must be
 * escaped first so later replacements don't double-escape.
 */
export function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * RFC 5545 §3.3.5 — UTC date-time form. No dashes, no colons, always
 * in zulu time. Example: `20260410T140000Z`.
 */
export function formatUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * RFC 5545 §3.1 — fold content lines longer than 75 octets. The
 * continuation line must start with a single space (or tab). We use
 * character count as a close-enough approximation of octets for
 * our text which is ASCII for the structural parts and may contain
 * UTF-8 in values — erring slightly short is safe.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  const out: string[] = [];
  let i = 0;
  // First chunk: 75 chars.
  out.push(line.slice(i, i + 75));
  i += 75;
  // Subsequent chunks: 74 chars (leaving room for the leading space).
  while (i < line.length) {
    out.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return out.join("\r\n");
}

// ────────────────────────────────────────────────────────────────────
// Web-intent URL helpers — one-click "Add to {Google,Outlook,Yahoo}"
// ────────────────────────────────────────────────────────────────────
//
// These generate deep-links that pre-fill a new event in the user's
// web calendar of choice. They're a nice fallback when the user is
// on a device that can't open an .ics attachment (or when they just
// prefer a single click over a download).
//
// The formats are undocumented-but-stable URL schemes that each
// vendor has supported for years:
//
//   Google  — https://calendar.google.com/calendar/render?action=TEMPLATE...
//   Outlook — https://outlook.live.com/calendar/0/deeplink/compose?...
//   Yahoo   — https://calendar.yahoo.com/?v=60&title=...

export type WebIntentInput = {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
};

export function googleCalendarUrl(e: WebIntentInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${formatUtc(e.start)}/${formatUtc(e.end)}`,
  });
  if (e.description) params.set("details", e.description);
  if (e.location) params.set("location", e.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(e: WebIntentInput): string {
  // Outlook wants ISO 8601 strings, not the compact iCal form.
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: e.start.toISOString(),
    enddt: e.end.toISOString(),
  });
  if (e.description) params.set("body", e.description);
  if (e.location) params.set("location", e.location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function yahooCalendarUrl(e: WebIntentInput): string {
  const params = new URLSearchParams({
    v: "60",
    title: e.title,
    st: formatUtc(e.start),
    et: formatUtc(e.end),
  });
  if (e.description) params.set("desc", e.description);
  if (e.location) params.set("in_loc", e.location);
  return `https://calendar.yahoo.com/?${params.toString()}`;
}
