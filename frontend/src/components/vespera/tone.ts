import type { Tone } from "@/lib/types";

export const TONE_VAR: Record<Tone, string> = {
  sand: "var(--sand-300)",
  steel: "var(--steel)",
  copper: "var(--copper)",
  sage: "var(--sage)",
  rose: "var(--rose)",
  lavender: "var(--lavender)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
  info: "var(--info)",
  muted: "rgba(217,203,174,0.45)",
};

export const SERIES = [
  "var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)", "var(--series-6)",
];

/** Accept a palette token name, or any CSS color; fall back to sand. */
export function toneColor(input?: string, fallbackIndex = 0): string {
  if (!input) return SERIES[fallbackIndex % SERIES.length];
  if (input in TONE_VAR) return TONE_VAR[input as Tone];
  // legacy hex from old palette -> map to muted equivalents
  const legacy: Record<string, string> = {
    "#0ea5e9": "var(--steel)", "#38bdf8": "var(--steel)", "#f97316": "var(--copper)", "#4ade80": "var(--sage)",
    "#facc15": "var(--warn)", "#ef4444": "var(--err)", "#8b5cf6": "var(--lavender)", "#c0357a": "var(--rose)",
    // backend semantic tokens
    primary: "var(--sand-300)", secondary: "var(--steel)", accent: "var(--copper)", success: "var(--sage)",
    warning: "var(--warn)", danger: "var(--err)", error: "var(--err)", neutral: TONE_VAR.muted, default: "var(--sand-300)",
    blue: "var(--steel)", green: "var(--sage)", orange: "var(--copper)", yellow: "var(--warn)", purple: "var(--lavender)", pink: "var(--rose)", red: "var(--err)", gray: TONE_VAR.muted,
    mavi: "var(--steel)", yeşil: "var(--sage)", turuncu: "var(--copper)", sarı: "var(--warn)", mor: "var(--lavender)", pembe: "var(--rose)", kırmızı: "var(--err)", gri: TONE_VAR.muted,
  };
  if (input.toLowerCase() in legacy) return legacy[input.toLowerCase()];
  // only pass through real CSS colors; unknown tokens fall back to the series palette
  if (/^(#|rgb|hsl|var\()/.test(input)) return input;
  return SERIES[fallbackIndex % SERIES.length];
}
