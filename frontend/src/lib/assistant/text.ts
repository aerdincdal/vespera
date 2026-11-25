/* Turkish-aware text helpers: folding for fuzzy matching and number formatting. */

const DIACRITICS: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

/** Locale-correct lowercase (İ → i, I → ı). */
export function trLower(s: string): string {
  return s.replace(/İ/g, "i").replace(/I/g, "ı").toLocaleLowerCase("tr-TR");
}

/** Lowercase + strip Turkish diacritics; keeps letters, digits, spaces and hyphens. */
export function fold(s: string): string {
  return trLower(s)
    .replace(/[çğıöşüâîû]/g, (c) => DIACRITICS[c] ?? c)
    .replace(/['’`´]\S*/g, "") // 40'tan → 40, Satış'ta → satis
    .replace(/[^a-z0-9%\-\s.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Column / value names: fold and drop unit parentheses like "(yıl)" or "(%)". */
export function foldName(s: string): string {
  return fold(s.replace(/\([^)]*\)/g, " ")).replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
}

/** Split a folded name into match words; hyphenated names produce a split and a joined variant. */
export function nameWordVariants(name: string): string[][] {
  const base = foldName(name);
  const split = base.split(/[\s-]+/).filter(Boolean);
  const variants: string[][] = [split];
  if (base.includes("-")) {
    const joined = base.split(/\s+/).map((w) => w.replace(/-/g, "")).filter(Boolean);
    variants.push(joined);
  }
  return variants;
}

export interface Token {
  /** folded surface form (suffix after apostrophe already removed) */
  text: string;
  /** numeric value when the token is a number ("3,5" → 3.5) */
  num?: number;
}

/** Tokenize a Turkish question into folded words / numbers. */
export function tokenize(q: string): Token[] {
  const folded = fold(q);
  const parts = folded.split(/[\s]+/).filter(Boolean);
  const out: Token[] = [];
  for (const raw of parts) {
    // split hyphenated words (ar-ge → ar, ge) but keep negative numbers
    const pieces = /^-?\d/.test(raw) ? [raw] : raw.split("-").filter(Boolean);
    for (const p of pieces) {
      const cleaned = p.replace(/^[.,]+|[.,%]+$/g, "");
      if (!cleaned) continue;
      const num = parseTrNumber(cleaned);
      out.push(num !== null ? { text: cleaned, num } : { text: cleaned });
    }
  }
  return out;
}

/** "1.234,56" → 1234.56 · "3,5" → 3.5 · "40" → 40 · "12.5" → 12.5 · else null */
export function parseTrNumber(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return Number(t.replace(/\./g, "").replace(",", "."));
  if (/^-?\d+,\d+$/.test(t)) return Number(t.replace(",", "."));
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return Number(t.replace(/,/g, ""));
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return null;
}

const nf = (digits: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Turkish number formatting; digits auto-chosen when omitted (integers stay integers). */
export function fmtNum(n: number, digits?: number): string {
  if (!Number.isFinite(n)) return "—";
  const d = digits ?? (Number.isInteger(n) ? 0 : Math.abs(n) >= 100 ? 1 : 2);
  return nf(d).format(n);
}

export function fmtMoney(n: number): string {
  return `${fmtNum(n, Number.isInteger(n) ? 0 : 2)} ₺`;
}

export function fmtPct(n: number, digits = 1): string {
  return `%${fmtNum(n, digits)}`;
}

/** Round for chart payloads (keeps numbers numeric). */
export function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Levenshtein distance, used for typo-tolerant word matching. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Does a query token stand for a name word? Prefix match handles Turkish suffixes (departmanlara → departman). */
export function wordMatches(token: string, word: string): boolean {
  if (!token || !word) return false;
  if (token === word) return true;
  if (word.length <= 2) return false;
  if (word.length >= 3 && token.startsWith(word)) return true;
  // stem of the word itself may be shorter than the token (memnuniyeti vs memnuniyet)
  if (token.length >= 4 && word.startsWith(token) && token.length >= word.length - 2) return true;
  // typo tolerance only for whole tokens of similar length (departmna → departman)
  if (word.length >= 6 && Math.abs(token.length - word.length) <= 1 && editDistance(token, word) <= 1) return true;
  return false;
}

/** Join items Turkish-style: "a, b ve c". */
export function joinTr(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ve ${items[items.length - 1]}`;
}
