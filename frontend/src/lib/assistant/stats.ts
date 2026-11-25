import type { Cell } from "./types";

export const numbersOf = (values: Cell[]): number[] => values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));

export const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
export const min = (xs: number[]): number => (xs.length ? Math.min(...xs) : NaN);
export const max = (xs: number[]): number => (xs.length ? Math.max(...xs) : NaN);

export function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1));
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return NaN;
  const mx = mean(xs.slice(0, n)), my = mean(ys.slice(0, n));
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den ? num / den : NaN;
}

export type Agg = "mean" | "sum" | "count" | "min" | "max" | "median";

export function aggregate(agg: Agg, xs: number[]): number {
  switch (agg) {
    case "mean": return mean(xs);
    case "sum": return sum(xs);
    case "min": return min(xs);
    case "max": return max(xs);
    case "median": return median(xs);
    case "count": return xs.length;
  }
}

export interface Bin {
  label: string;
  lo: number;
  hi: number;
  count: number;
}

/** "Nice" width from 1·10^k, 2·10^k, 5·10^k. */
function niceWidth(rawWidth: number): number {
  if (rawWidth <= 0) return 1;
  const exp = Math.floor(Math.log10(rawWidth));
  const base = 10 ** exp;
  const frac = rawWidth / base;
  const step = frac <= 1.5 ? 1 : frac <= 3.5 ? 2 : frac <= 7.5 ? 5 : 10;
  return step * base;
}

/** Equal-width histogram with 6–12 bins and Turkish range labels ("18–22"). */
export function histogram(xs: number[], targetBins = 9, fmt: (n: number) => string = (n) => String(n)): Bin[] {
  if (!xs.length) return [];
  const lo = min(xs), hi = max(xs);
  if (lo === hi) return [{ label: fmt(lo), lo, hi, count: xs.length }];
  const allInt = xs.every((x) => Number.isInteger(x));
  let width = niceWidth((hi - lo) / targetBins);
  if (allInt && width < 1) width = 1;
  // small integer scales start at their minimum (18–22, 23–27 …); wide ranges snap to a round start (1.000–2.999)
  const startFor = (w: number) => (allInt && w <= 10 ? lo : Math.floor(lo / w) * w);
  let start = startFor(width);
  let n = Math.ceil((hi - start + (allInt ? 1 : Number.EPSILON)) / width);
  while (n > 12) {
    width = niceWidth(width * 1.5);
    start = startFor(width);
    n = Math.ceil((hi - start + (allInt ? 1 : Number.EPSILON)) / width);
  }
  const bins: Bin[] = Array.from({ length: n }, (_, i) => {
    const bLo = start + i * width;
    const bHi = bLo + width;
    const shownHi = allInt ? Math.min(bHi - 1, hi) : bHi;
    const label = allInt && width > 1 ? (shownHi > bLo ? `${fmt(bLo)}–${fmt(shownHi)}` : fmt(bLo)) : allInt ? fmt(bLo) : `${fmt(bLo)}–${fmt(bHi)}`;
    return { label, lo: bLo, hi: bHi, count: 0 };
  });
  for (const x of xs) {
    let idx = Math.floor((x - start) / width);
    if (idx >= n) idx = n - 1;
    if (idx < 0) idx = 0;
    bins[idx].count++;
  }
  return bins;
}

/** Interpret |r| in Turkish. */
export function correlationStrength(r: number): { word: string; direction: string } {
  const a = Math.abs(r);
  const word = a < 0.1 ? "ihmal edilebilir" : a < 0.3 ? "zayıf" : a < 0.6 ? "orta" : "güçlü";
  const direction = r > 0 ? "pozitif" : r < 0 ? "negatif" : "";
  return { word, direction };
}
