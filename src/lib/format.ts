// Formatting helpers for currency, percentages, and dates

export function formatCurrency(value: number, currency = "USD", compact = false): string {
  if (!Number.isFinite(value)) return "—";
  const signed = value < 0;
  const abs = Math.abs(value);
  const opts: Intl.NumberFormatOptions = compact
    ? { notation: "compact", maximumFractionDigits: 1 }
    : { maximumFractionDigits: 0 };
  let out = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    ...opts,
  }).format(abs);
  if (compact) {
    // Intl compact already returns $1.2K style
  }
  return signed ? `-${out}` : out;
}

export function formatNumber(value: number, compact = false): string {
  return new Intl.NumberFormat("en-US", compact ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value >= 0 ? "" : ""}${value.toFixed(digits)}%`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}

export function monthLabel(month1: number): string {
  // month1 is 1-indexed
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2000, month1 - 1, 1));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function pct(part: number, whole: number, digits = 1): number {
  if (!whole) return 0;
  return (part / whole) * 100;
}
