import { format, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale";

/** "2023-08-16" -> "16 Ağu 2023". Non-ISO strings pass through. */
export function fmtDate(v: string | Date | undefined | null): string {
  if (!v) return "";
  const d = typeof v === "string" ? parseISO(v) : v;
  if (!isValid(d)) return String(v);
  return format(d, "d MMM yyyy", { locale: tr });
}

export function fmtNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}

export function fmtTRY(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `₺${Math.round(n / 1_000)}K`;
  }
  return `${fmtNumber(n)} ₺`;
}

export function fmtTime(d: Date = new Date()): string {
  return format(d, "HH:mm");
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a delta string like "+12.5%" / "-3 gün" -> sign */
export function deltaSign(delta?: string | number): 1 | -1 | 0 {
  if (delta === undefined || delta === null || delta === "") return 0;
  if (typeof delta === "number") return delta > 0 ? 1 : delta < 0 ? -1 : 0;
  const t = delta.trim();
  if (t.startsWith("-")) return -1;
  if (t.startsWith("+")) return 1;
  return 0;
}

export function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
