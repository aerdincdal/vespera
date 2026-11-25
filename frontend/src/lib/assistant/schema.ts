import type { Cell, ColumnKind, ColumnMeta, Row, Schema } from "./types";
import { fold, foldName, nameWordVariants, wordMatches, type Token } from "./text";

const YES_WORDS = new Set(["evet", "var", "yes", "true", "1", "aktif", "e"]);
const NO_WORDS = new Set(["hayir", "yok", "no", "false", "0", "pasif", "h"]);

const MONEY_RE = /(gelir|ucret|maas|fiyat|tutar|gider|maliyet|kazanc|ciro|butce|odeme|bedel)/;
const PERCENT_RE = /(%|oran|yuzde)/;
const TEMPORAL_RE = /(yil|ay\b|tarih|donem|hafta|gun\b|sure)/;
const ID_RE = /(\bno\b|\bid\b|numara|kod)/;

/** Infer column types, categorical value sets and formatting hints from the rows. */
export function inferSchema(rows: Row[]): Schema {
  const names = rows.length ? Object.keys(rows[0]) : [];
  const columns: ColumnMeta[] = names.map((name) => {
    const values = rows.map((r) => r[name]).filter((v): v is Cell => v !== null && v !== undefined && v !== "");
    const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const distinctSet = new Map<string, Cell>();
    for (const v of values) {
      const k = String(v);
      if (!distinctSet.has(k)) distinctSet.set(k, v);
      if (distinctSet.size > 60) break;
    }
    const distinct = [...distinctSet.values()];
    const key = foldName(name);
    const isNumeric = values.length > 0 && nums.length / values.length >= 0.9;
    const distinctCount = distinctCountExact(values);
    const ordinal = isNumeric && distinctCount <= 10 && nums.every((n) => Number.isInteger(n));
    const uniqueish = distinctCount >= values.length * 0.98 && values.length > 20;
    let kind: ColumnKind;
    if (isNumeric && uniqueish && ID_RE.test(` ${key} `)) kind = "id";
    else if (isNumeric) kind = "numeric";
    else if (distinctCount <= Math.max(30, Math.round(values.length * 0.05)) && !uniqueish) kind = "categorical";
    else kind = "text";

    const folded = distinct.map((d) => fold(String(d)));
    const binary = kind === "categorical" && distinctCount === 2 && folded.some((f) => YES_WORDS.has(f)) && folded.some((f) => NO_WORDS.has(f));
    const positive = binary ? String(distinct[folded.findIndex((f) => YES_WORDS.has(f))]) : undefined;

    const meta: ColumnMeta = {
      name,
      key,
      wordVariants: nameWordVariants(name),
      kind,
      ordinal,
      binary,
      positive,
      money: MONEY_RE.test(key),
      percent: PERCENT_RE.test(key) || /\(%\)/.test(name),
      temporal: TEMPORAL_RE.test(key),
      distinct: kind === "categorical" || ordinal ? sortDistinct(distinct) : distinct.slice(0, 5),
      nonEmpty: values.length,
    };
    if (isNumeric && nums.length) {
      meta.min = Math.min(...nums);
      meta.max = Math.max(...nums);
    }
    return meta;
  });
  const keys = columns.map((c) => c.key);
  const hrLike = keys.some((k) => /(personel|calisan|pozisyon|departman|cinsiyet|maas|gelir)/.test(k));
  return { columns, rowCount: rows.length, unit: hrLike ? "Kişi" : "Kayıt", byName: new Map(columns.map((c) => [c.name, c])) };
}

function distinctCountExact(values: Cell[]): number {
  const s = new Set<string>();
  for (const v of values) s.add(String(v));
  return s.size;
}

function sortDistinct(values: Cell[]): Cell[] {
  return [...values].sort((a, b) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "tr")));
}

/* ------------------------------------------------------------------ */
/*  Synonyms: query stems → preferred (folded) column names            */
/* ------------------------------------------------------------------ */

interface SynonymGroup {
  stems: string[];
  targets: string[];
  /** tokens that start with these are NOT this synonym (yas vs yasam) */
  exclude?: string[];
}

const SYNONYMS: SynonymGroup[] = [
  { stems: ["maas", "gelir", "ucret", "kazanc", "salary", "income"], targets: ["aylik gelir", "gelir", "maas", "aylik ucret", "ucret"] },
  { stems: ["yas"], targets: ["yas"], exclude: ["yasam", "yasa", "yast"] },
  { stems: ["cinsiyet", "gender"], targets: ["cinsiyet"] },
  { stems: ["departman", "bolum", "birim", "department"], targets: ["departman", "bolum", "birim"] },
  { stems: ["pozisyon", "rol", "unvan", "gorev", "meslek", "role"], targets: ["pozisyon", "unvan", "gorev", "rol"] },
  { stems: ["ayril", "isten ayril", "cikan", "cikis", "turnover", "attrition", "kayip"], targets: ["ayrilma", "isten ayrilma", "cikis"] },
  { stems: ["mesai", "fazla mesai", "overtime"], targets: ["fazla mesai", "mesai"] },
  { stems: ["medeni"], targets: ["medeni durum", "medeni"] },
  { stems: ["egitim"], targets: ["egitim seviyesi", "egitim"], exclude: ["egitim alan", "egitim sayi"] },
  { stems: ["memnuniyet", "tatmin"], targets: ["is memnuniyeti", "memnuniyet"] },
  { stems: ["deneyim", "kidem", "tecrube", "experience"], targets: ["toplam deneyim", "deneyim", "kidem", "tecrube"] },
  { stems: ["performans"], targets: ["performans puani", "performans"] },
  { stems: ["zam", "artis"], targets: ["zam orani", "zam"] },
  { stems: ["seyahat", "gezi"], targets: ["is seyahati", "seyahat"] },
  { stems: ["uzaklik", "mesafe", "km"], targets: ["eve uzaklik", "uzaklik", "mesafe"] },
  { stems: ["kademe", "seviye", "level"], targets: ["kademe", "seviye"] },
  { stems: ["hisse"], targets: ["hisse opsiyonu", "hisse"] },
  { stems: ["denge"], targets: ["is-yasam dengesi", "is yasam dengesi", "denge"] },
  { stems: ["baglilik"], targets: ["ise baglilik", "baglilik"] },
  { stems: ["terfi"], targets: ["son terfiden bu yana", "terfi"] },
  { stems: ["yonetici", "mudur"], targets: ["mevcut yoneticiyle yil"] },
];

export interface Mention {
  column: ColumnMeta;
  start: number;
  end: number; // exclusive
  /** higher wins on overlap */
  score: number;
  via: "name" | "synonym";
}

export interface ValueMention {
  column: ColumnMeta;
  value: Cell;
  start: number;
  end: number;
  score: number;
}

/** Try to match `words` at token index i, allowing one skipped query token between words. */
function matchWordsAt(tokens: Token[], i: number, words: string[]): number | null {
  let j = i;
  for (const w of words) {
    if (j < tokens.length && wordMatches(tokens[j].text, w)) j++;
    else if (j + 1 < tokens.length && j > i && wordMatches(tokens[j + 1].text, w)) j += 2;
    else return null;
  }
  return j;
}

/** Find column mentions in the tokens (by name words, then by synonyms), resolving overlaps. */
export function findColumnMentions(tokens: Token[], schema: Schema): Mention[] {
  const raw: Mention[] = [];
  for (const col of schema.columns) {
    for (const words of col.wordVariants) {
      if (!words.length) continue;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].num !== undefined) continue;
        const end = matchWordsAt(tokens, i, words);
        if (end !== null) {
          const exact = words.filter((w, k) => tokens[i + k]?.text === w).length;
          const skips = end - i - words.length;
          raw.push({ column: col, start: i, end, score: words.length * 3 + exact * 0.5 - skips, via: "name" });
        }
      }
    }
  }
  for (const group of SYNONYMS) {
    const target = resolveTarget(group.targets, schema);
    if (!target) continue;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i].text;
      if (tokens[i].num !== undefined) continue;
      if (group.exclude?.some((ex) => (t + " " + (tokens[i + 1]?.text ?? "")).startsWith(ex))) continue;
      for (const stem of group.stems) {
        const stemWords = stem.split(" ");
        const end = matchStem(tokens, i, stemWords);
        if (end !== null) {
          raw.push({ column: target, start: i, end, score: stemWords.length * 3 - 0.5, via: "synonym" });
          break;
        }
      }
    }
  }
  return resolveOverlaps(raw);
}

function matchStem(tokens: Token[], i: number, stemWords: string[]): number | null {
  let j = i;
  for (const w of stemWords) {
    const t = tokens[j]?.text;
    if (!t) return null;
    if (t === w || (w.length >= 3 && t.startsWith(w))) j++;
    else return null;
  }
  return j;
}

function resolveTarget(targets: string[], schema: Schema): ColumnMeta | null {
  for (const t of targets) {
    const exact = schema.columns.find((c) => c.key === t);
    if (exact) return exact;
  }
  for (const t of targets) {
    const partial = schema.columns.find((c) => c.key.includes(t));
    if (partial) return partial;
  }
  return null;
}

function resolveOverlaps<T extends { start: number; end: number; score: number }>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => b.score - a.score || a.start - b.start);
  const taken: boolean[] = [];
  const out: T[] = [];
  for (const m of sorted) {
    let clash = false;
    for (let k = m.start; k < m.end; k++) if (taken[k]) clash = true;
    if (clash) continue;
    for (let k = m.start; k < m.end; k++) taken[k] = true;
    out.push(m);
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Find categorical values spelled out in the question ("Satış", "kadın", "Ar-Ge", "İnsan Kaynakları"). */
export function findValueMentions(tokens: Token[], schema: Schema, columnMentions: Mention[]): ValueMention[] {
  const raw: ValueMention[] = [];
  const mentionedCols = new Set(columnMentions.map((m) => m.column.name));
  for (const col of schema.columns) {
    if (col.kind !== "categorical" || col.binary) continue;
    for (const v of col.distinct) {
      if (typeof v !== "string" || v.length < 3) continue;
      for (const words of nameWordVariants(v)) {
        if (!words.length || words.join("").length < 3) continue;
        for (let i = 0; i < tokens.length; i++) {
          const end = matchValueAt(tokens, i, words);
          if (end !== null) {
            const bonus = mentionedCols.has(col.name) ? 1 : 0;
            raw.push({ column: col, value: v, start: i, end, score: words.length * 3 + bonus });
          }
        }
      }
    }
  }
  // value mentions must not collide with column-name mentions
  const blocked: boolean[] = [];
  for (const m of columnMentions) for (let k = m.start; k < m.end; k++) blocked[k] = true;
  const free = raw.filter((v) => {
    for (let k = v.start; k < v.end; k++) if (blocked[k]) return false;
    return true;
  });
  return resolveOverlaps(free);
}

/** Values need every word matched consecutively; single short words must match exactly or as prefix (kadin → kadın). */
function matchValueAt(tokens: Token[], i: number, words: string[]): number | null {
  let j = i;
  for (const w of words) {
    const t = tokens[j]?.text;
    if (!t || tokens[j].num !== undefined) return null;
    const ok = t === w || (w.length >= 4 && t.startsWith(w)) || (w.length >= 3 && t.length <= w.length + 5 && t.startsWith(w));
    if (!ok) return null;
    j++;
  }
  return j;
}
