/* Deterministic pseudo-data for demo drill-downs: same title → same numbers, on every render and on both server and client. */

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** 12 points drifting toward `end` (if given), with mild noise. */
export function trendSeries(seed: string, end?: number, opts?: { volatility?: number; base?: number }): number[] {
  const rnd = seededRng(hashStr(seed));
  const target = end ?? 60 + rnd() * 40;
  const start = target * (0.72 + rnd() * 0.2);
  const vol = opts?.volatility ?? 0.06;
  const out: number[] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const drift = start + (target - start) * (t * t * (3 - 2 * t)); // smoothstep
    const noise = (rnd() - 0.5) * 2 * vol * Math.abs(target || 1);
    out.push(i === 11 ? target : drift + noise);
  }
  return out;
}

/** Pull the leading number out of "₺12.8M", "92.5", "1,450 birim" → 12.8 / 92.5 / 1450 */
export function leadingNumber(v: string | number | undefined): number | undefined {
  if (typeof v === "number") return v;
  if (!v) return undefined;
  const m = /-?[\d.,]+/.exec(v);
  if (!m) return undefined;
  const raw = m[0];
  const normalized = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw) ? raw.replace(/,/g, "") : /^\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, "") : raw.replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isNaN(n) ? undefined : n;
}

export function fmtLike(sample: string | number | undefined, n: number): string {
  if (typeof sample === "string") {
    const m = /^([^\d-]*)(-?[\d.,]+)(.*)$/.exec(sample);
    if (m) {
      const [, prefix, numRaw, suffix] = m;
      const decimals = (numRaw.split(/[.,]/)[1] ?? "").length > 0 && !/^\d{1,3}([.,]\d{3})+$/.test(numRaw) ? Math.min(2, (numRaw.split(/[.,]/)[1] ?? "").length) : 0;
      const grouped = /^\d{1,3}(,\d{3})+$/.test(numRaw);
      const body = grouped ? Math.round(n).toLocaleString("en-US") : n.toFixed(decimals);
      return `${prefix}${body}${suffix}`;
    }
  }
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export const DEMO_STATUSES = ["Tamamlandı", "Planlandı", "Beklemede", "Çalışıyor", "Kritik", "Onaylandı"];
export const DEMO_OWNERS = ["A. Yılmaz", "S. Aydın", "M. Kaya", "E. Demir", "B. Çelik", "D. Şahin"];
