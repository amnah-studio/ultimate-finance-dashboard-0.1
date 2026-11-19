// ICS (iCalendar) generator & parser for calendar sync.
// Standard format that works with Google Calendar, Apple Calendar, Outlook, etc.

import type { Transaction, TxType } from "./types";
import { TX_TYPES } from "./types";
import { uid } from "./format";

// ---------- Helpers ----------

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toICSDate(d: Date): string {
  // Format: YYYYMMDDTHHMMSSZ (UTC)
  return (
    d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  );
}

function toICSDateOnly(d: Date): string {
  // All-day events: YYYYMMDD
  return (
    d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate())
  );
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function unfoldICS(text: string): string {
  // RFC 5545: Lines should be folded at 75 chars. Unfold them.
  return text.replace(/\r?\n[ \t]/g, "");
}

// ---------- Generator ----------

export interface ExportOptions {
  /** Number of months to project recurring events forward from today. Default: 12 */
  monthsAhead?: number;
  /** Include all transaction types if true; otherwise just bills/debt/savings/investments. */
  includeAll?: boolean;
}

const RECURRING_TYPES: TxType[] = ["bill", "debt", "savings", "investment"];

export function generateICS(transactions: Transaction[], opts: ExportOptions = {}): string {
  const monthsAhead = opts.monthsAhead ?? 12;
  const includeAll = opts.includeAll ?? false;
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  const events: string[] = [];
  const seen = new Set<string>();

  for (const t of transactions) {
    const isRecurringType = RECURRING_TYPES.includes(t.type);
    if (!includeAll && !isRecurringType) continue;

    // For recurring transactions, project monthly forward until endDate.
    // For non-recurring, just use the original date.
    const baseDate = new Date(t.date + "T08:00:00Z");
    if (Number.isNaN(baseDate.getTime())) continue;

    if (t.recurring || isRecurringType) {
      let current = new Date(baseDate);
      // Skip past events older than 6 months ago
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 6);
      while (current < cutoff) {
        current.setMonth(current.getMonth() + 1);
      }
      while (current <= endDate) {
        const ev = buildEvent(t, current, true);
        const key = ev.uid;
        if (!seen.has(key)) {
          seen.add(key);
          events.push(ev.body);
        }
        current = new Date(current);
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      // One-off event — only include if it's in the next `monthsAhead` window
      if (baseDate >= now && baseDate <= endDate) {
        const ev = buildEvent(t, baseDate, false);
        if (!seen.has(ev.uid)) {
          seen.add(ev.uid);
          events.push(ev.body);
        }
      }
    }
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ultimate Finance Dashboard//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Ultimate Finance",
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildEvent(t: Transaction, date: Date, recurring: boolean): { uid: string; body: string } {
  const typeLabel = TX_TYPES.find((x) => x.key === t.type)?.label ?? t.type;
  const dateOnly = toICSDateOnly(date);
  const dtstamp = toICSDate(new Date());
  const eventUid = `finance-${t.id}-${dateOnly}@ultimate-finance`;
  const sign = t.type === "income" ? "+" : "−";
  const summary = `[${typeLabel}] ${t.description} (${sign}$${t.amount.toFixed(0)})`;
  const description = [
    `Type: ${typeLabel}`,
    `Category: ${t.category}`,
    `Description: ${t.description}`,
    `Amount: $${t.amount.toFixed(2)}`,
    recurring ? "Recurring: monthly" : "One-time",
  ].join("\\n");

  const lines = [
    "BEGIN:VEVENT",
    `UID:${eventUid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dateOnly}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `CATEGORIES:${typeLabel}`,
  ];
  if (recurring) {
    lines.push("RRULE:FREQ=MONTHLY");
  }
  lines.push("END:VEVENT");
  return { uid: eventUid, body: lines.join("\r\n") };
}

// ---------- Parser ----------

export interface ParsedEvent {
  uid: string;
  summary: string;
  description: string;
  start: string; // ISO date yyyy-mm-dd
  categories: string;
  recurring: boolean;
}

export interface ParseResult {
  events: ParsedEvent[];
  errors: string[];
}

export function parseICS(text: string): ParseResult {
  const errors: string[] = [];
  const events: ParsedEvent[] = [];
  const unfolded = unfoldICS(text);
  const lines = unfolded.split(/\r?\n/);

  let inEvent = false;
  let cur: Partial<ParsedEvent> & { rrule?: string } = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") {
      inEvent = true;
      cur = { recurring: false };
      continue;
    }
    if (trimmed === "END:VEVENT") {
      inEvent = false;
      if (cur.uid && cur.start) {
        events.push({
          uid: cur.uid,
          summary: cur.summary ?? "",
          description: cur.description ?? "",
          start: cur.start,
          categories: cur.categories ?? "",
          recurring: !!cur.rrule && /FREQ=MONTHLY/i.test(cur.rrule),
        });
      }
      continue;
    }
    if (!inEvent) continue;

    // Property parsing: NAME;PARAMS:VALUE  (split at first unquoted ":)
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const namePart = trimmed.slice(0, colonIdx);
    const value = trimmed.slice(colonIdx + 1);
    const name = namePart.split(";")[0].toUpperCase();

    switch (name) {
      case "UID":
        cur.uid = value;
        break;
      case "SUMMARY":
        cur.summary = unescapeICS(value);
        break;
      case "DESCRIPTION":
        cur.description = unescapeICS(value);
        break;
      case "CATEGORIES":
        cur.categories = value;
        break;
      case "DTSTART": {
        // Strip any VALUE=DATE or TZID params; value is what's after the colon.
        // Detect all-day vs. timed.
        const isAllDay = /VALUE=DATE/i.test(namePart);
        const dateOnly = isAllDay ? value.slice(0, 8) : value.replace(/Z$/, "").slice(0, 8);
        if (/^\d{8}$/.test(dateOnly)) {
          cur.start = `${dateOnly.slice(0, 4)}-${dateOnly.slice(4, 6)}-${dateOnly.slice(6, 8)}`;
        }
        break;
      }
      case "RRULE":
        cur.rrule = value;
        break;
    }
  }

  if (events.length === 0 && lines.filter((l) => l.includes("BEGIN:VEVENT")).length > 0) {
    errors.push("Could not extract any valid events — check that each VEVENT has UID and DTSTART.");
  }

  return { events, errors };
}

function unescapeICS(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// ---------- Convert parsed events to transactions ----------

export interface ImportedTransactionDraft {
  type: TxType;
  category: string;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
}

const TYPE_KEYWORDS: Record<TxType, string[]> = {
  income: ["income", "salary", "paycheck", "deposit", "dividend", "bonus"],
  expense: ["expense", "grocery", "groceries", "dining", "restaurant", "shopping", "fuel", "transport"],
  bill: ["bill", "rent", "utility", "utilities", "internet", "phone", "insurance", "subscription"],
  debt: ["debt", "loan", "credit card", "mortgage", "payment"],
  savings: ["saving", "savings", "emergency fund", "vacation", "transfer"],
  investment: ["invest", "investment", "etf", "stock", "crypto", "ira", "401k"],
};

function detectType(summary: string, description: string): TxType {
  const hay = `${summary} ${description}`.toLowerCase();
  for (const t of ["income", "expense", "bill", "debt", "savings", "investment"] as TxType[]) {
    if (TYPE_KEYWORDS[t].some((k) => hay.includes(k))) return t;
  }
  return "expense"; // default
}

function detectAmount(text: string): number {
  // Look for $X.YY patterns
  const m = text.match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  if (m) {
    const n = Number(m[1]);
    if (n > 0 && n < 1_000_000) return n;
  }
  return 0;
}

function detectCategory(text: string, type: TxType): string {
  const lower = text.toLowerCase();
  const candidates: Record<TxType, string[]> = {
    income: ["salary", "freelance", "bonus", "dividends", "refund", "other income"],
    expense: ["groceries", "dining", "transport", "entertainment", "shopping", "health", "subscriptions", "other"],
    bill: ["rent", "utilities", "internet", "phone", "insurance", "streaming"],
    debt: ["credit card", "student loan", "personal loan", "mortgage"],
    savings: ["emergency fund", "vacation", "car", "house", "retirement"],
    investment: ["stocks", "etf", "crypto", "bonds", "retirement"],
  };
  for (const c of candidates[type]) {
    if (lower.includes(c)) return c;
  }
  return candidates[type][0];
}

export function eventsToTransactions(events: ParsedEvent[]): ImportedTransactionDraft[] {
  return events.map((e) => {
    const text = `${e.summary} ${e.description}`;
    const type = detectType(e.summary, e.description);
    const amount = detectAmount(text);
    return {
      type,
      category: detectCategory(text, type),
      description: e.summary.replace(/^\[[^\]]+\]\s*/, "").trim() || "Imported event",
      amount: amount > 0 ? amount : 0,
      date: e.start,
      recurring: e.recurring,
    };
  });
}

// ---------- Download helper ----------

export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function generateUID(): string {
  return uid("ics");
}
