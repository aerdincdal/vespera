/**
 * Turkish natural-language → analysis engine that runs fully in the browser.
 * Works over any Row[] table (HR demo dataset or a CSV parsed on the client).
 */
import type { ChatChart, ChatResponse, ChatTable } from "../types";
import type { Cell, ColumnMeta, Row, Schema } from "./types";
import { inferSchema, findColumnMentions, findValueMentions, type Mention } from "./schema";
import { fmtMoney, fmtNum, fmtPct, joinTr, round, tokenize, type Token } from "./text";
import { aggregate, correlationStrength, histogram, mean, median, numbersOf, pearson, std, type Agg } from "./stats";

export type FilterOp = "eq" | "neq" | "in" | "gt" | "gte" | "lt" | "lte" | "between";

export interface Filter {
  column: ColumnMeta;
  op: FilterOp;
  value?: Cell;
  values?: Cell[];
  lo?: number;
  hi?: number;
}

export type Intent =
  | "greeting" | "help" | "columns" | "describe" | "count" | "groupby" | "rate"
  | "distribution" | "crosstab" | "top" | "correlation" | "aggregate" | "fallback";

export interface Analysis {
  intent: Intent;
  group?: ColumnMeta;
  metric?: ColumnMeta;
  second?: ColumnMeta;
  agg: Agg;
  n?: number;
  desc: boolean;
  filters: Filter[];
  /** the question asked for shares / percentages */
  pct: boolean;
}

const MAX_TABLE_ROWS = 50;

/* ------------------------------------------------------------------ */
/*  Keyword tables (folded Turkish)                                     */
/* ------------------------------------------------------------------ */

const RE = {
  greeting: /^(merhaba|selam|selamlar|gunaydin|iyi gunler|iyi aksamlar|hey|hi|hello|nasilsin|naber|sa|slm)\b/,
  help: /(yardim|neler yapabilir|ne yapabilir|nasil kullan|ornek soru|neler sorabilir|ne sorabilir|nasil calis)/,
  columns: /(sutun|kolon|degisken|alanlar|baslik|hangi veriler|veri seti(nde)? ne(ler)? var|veride ne(ler)? var|hangi bilgiler)/,
  describe: /(ozet|ozetle|genel bakis|betimsel|istatistik|describe|summary|genel durum)/,
  gore: /^(gore|bazinda|basina|itibariyle|acisindan|kirilim)/,
  rate: /(\boran|yuzde|%|\bpay\b|payi)/,
  dist: /(dagilim|histogram|frekans|dagit)/,
  corr: /(iliski|korelasyon|bagli|bagintili|etkis|etkiler|arasindaki|birlikte)/,
  mean: /(ortalama|\bort\b|mean|average|ortalamasi)/,
  sum: /(toplam|toplami|\bsum\b)/,
  median: /(medyan|ortanca)/,
  max: /(en yuksek|en fazla|en cok|en buyuk|maksimum|\bmax\b|en iyi|en pahali|en zengin|en kidemli|en yasli)/,
  min: /(en dusuk|en az|en kucuk|minimum|\bmin\b|en kotu|en ucuz|en genc)/,
  count: /(\bkac\b|sayisi|sayilari|\bsayi\b|\badet\b|kayit|satir|kisi sayisi|toplam calisan|calisan sayisi)/,
  list: /(listele|goster|sirala|ilk\b|\btop\b|kisiyi|kisileri|calisani|calisanlari|kaydi|kayitlari|kimler|hangileri|kim\b)/,
  participle: /^(yapan|yapanlar|yapanlarin|olan|olanlar|olanlarin|eden|edenler|edenlerin|arasinda|icinde|icin|olma|yapma)/,
  negParticiple: /^(olmayan|yapmayan|etmeyen|olmayanlar|yapmayanlar)/,
  countUnit: /^(kisi|kisiyi|kisinin|kisilik|calisan|calisani|calisanlar|calisanlarin|personel|personeli|kayit|kaydi|kayitlari|satir|satiri|tane|tanesi|adet|adedi|sonuc|sonucu|kisiler)/,
};

const GT = new Set(["buyuk", "fazla", "ustu", "ustunde", "yukari", "yukarisi", "uzeri", "uzerinde", "asan", "gecen", "cok", ">"]);
const LT = new Set(["kucuk", "az", "alti", "altinda", "dusuk", "asagi", "asagisi", "<"]);
const GTE = new Set([">=", "asgari"]);
const LTE = new Set(["<=", "kadar", "azami"]);

/* ------------------------------------------------------------------ */
/*  Interpretation                                                      */
/* ------------------------------------------------------------------ */

export function interpret(message: string, schema: Schema): Analysis {
  const tokens = tokenize(message);
  const text = tokens.map((t) => t.text).join(" ");
  const has = (re: RegExp) => re.test(text);

  const colMentions = findColumnMentions(tokens, schema);
  const valMentions = findValueMentions(tokens, schema, colMentions);

  // keywords are only read from tokens that are not part of a column / value name
  // ("Toplam Deneyim" must not turn into a sum, "Zam Oranı" not into a rate question)
  const covered: boolean[] = [];
  for (const m of [...colMentions, ...valMentions]) for (let k = m.start; k < m.end; k++) covered[k] = true;
  const freeText = tokens.filter((_, i) => !covered[i]).map((t) => t.text).join(" ");
  const hasFree = (re: RegExp) => re.test(freeText);

  const base: Analysis = { intent: "fallback", agg: "mean", desc: true, filters: [], pct: hasFree(RE.rate) };

  if (!tokens.length) return { ...base, intent: "help" };
  if (has(RE.greeting) && tokens.length <= 4 && !colMentions.length) return { ...base, intent: "greeting" };
  if (has(RE.help) && !colMentions.length) return { ...base, intent: "help" };
  if (has(RE.columns) && !colMentions.length) return { ...base, intent: "columns" };

  /* ---- filters ------------------------------------------------- */
  const filters: Filter[] = [];
  const consumed = new Set<Mention>();
  let n: number | undefined;

  // categorical value filters ("Satış departmanında", "kadın çalışanlar", "İnsan Kaynakları")
  const byCol = new Map<string, Cell[]>();
  for (const v of valMentions) {
    const arr = byCol.get(v.column.name) ?? [];
    arr.push(v.value);
    byCol.set(v.column.name, arr);
  }
  let comparisonGroup: ColumnMeta | undefined;
  for (const [name, values] of byCol) {
    const col = schema.byName.get(name)!;
    const uniq = [...new Set(values.map(String))].map((s) => values.find((v) => String(v) === s)!);
    if (uniq.length === 1) filters.push({ column: col, op: "eq", value: uniq[0] });
    else {
      filters.push({ column: col, op: "in", values: uniq });
      comparisonGroup = col;
    }
    // the column name itself ("departmanında") is then just context, not a grouping
    for (const m of colMentions) if (m.column.name === name && uniq.length === 1) consumed.add(m);
  }

  // numeric filters ("40'tan büyük", "en az 5 yıl", "30 ile 40 arasında") and top-N sizes ("5 kişi")
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.num === undefined) continue;
    const next = tokens[k + 1]?.text ?? "";
    const prev = tokens[k - 1]?.text ?? "";
    const prev2 = `${tokens[k - 2]?.text ?? ""} ${prev}`.trim();

    // "N kişi", "ilk N", "en yüksek N"
    if (RE.countUnit.test(next) || prev === "ilk" || prev === "top" || /^(en yuksek|en dusuk|en fazla|en az)$/.test(prev2) && RE.countUnit.test(tokens[k + 1]?.text ?? "")) {
      if (Number.isInteger(t.num) && t.num > 0 && t.num <= 500) n = t.num;
      continue;
    }

    // between: "30 ile 40 arasında" / "30 ve 40 arasında" / "30-40 arası"
    const t2 = tokens[k + 2];
    if ((next === "ile" || next === "ve") && t2?.num !== undefined && /^aras/.test(tokens[k + 3]?.text ?? "")) {
      const col = nearestNumericMention(colMentions, k, 5);
      if (col) {
        filters.push({ column: col.column, op: "between", lo: Math.min(t.num, t2.num), hi: Math.max(t.num, t2.num) });
        consumed.add(col);
        k += 3;
      }
      continue;
    }

    let op: FilterOp | null = null;
    for (let w = 1; w <= 3 && k + w < tokens.length; w++) {
      const word = tokens[k + w].text;
      if (tokens[k + w].num !== undefined) break;
      if (GTE.has(word) || (word === "ve" && /^(uzeri|ustu)/.test(tokens[k + w + 1]?.text ?? ""))) { op = "gte"; break; }
      if (LTE.has(word)) { op = "lte"; break; }
      if (GT.has(word)) { op = "gt"; break; }
      if (LT.has(word)) { op = "lt"; break; }
    }
    if (!op) {
      if (/^(en az|asgari|minimum)$/.test(prev2) || prev === "asgari" || prev === "minimum") op = "gte";
      else if (/^(en fazla|en cok|azami|maksimum)$/.test(prev2) || prev === "azami" || prev === "maksimum") op = "lte";
    }
    if (!op) continue;
    const col = nearestNumericMention(colMentions, k, 5);
    if (!col) continue;
    filters.push({ column: col.column, op, value: t.num });
    consumed.add(col);
  }

  // binary-column participles ("fazla mesai yapanlar", "ayrılanlar arasında", "mesai yapmayanlar")
  for (const m of colMentions) {
    if (!m.column.binary || consumed.has(m)) continue;
    const after = tokens[m.end]?.text ?? "";
    const after2 = tokens[m.end + 1]?.text ?? "";
    const surface = tokens[m.start].text;
    const participleSurface = /^(ayrilan|cikan|kalan)/.test(surface);
    const neg = RE.negParticiple.test(after) || RE.negParticiple.test(after2);
    const pos = RE.participle.test(after) || participleSurface;
    if (!neg && !pos) continue;
    // "ayrılma oranı" must stay a rate question even when spelled "ayrılanların oranı"
    const rateFollows = /^(oran|yuzde|payi|pay)/.test(after) || /^(oran|yuzde|payi|pay)/.test(after2);
    if (rateFollows && !neg) continue;
    const positive = m.column.positive!;
    const negative = String(m.column.distinct.find((d) => String(d) !== positive) ?? "");
    filters.push({ column: m.column, op: "eq", value: neg ? negative : positive });
    consumed.add(m);
  }

  /* ---- roles: group / metric / second ------------------------------ */
  const free = colMentions.filter((m) => !consumed.has(m));
  const goreIdx = tokens.findIndex((t) => RE.gore.test(t.text));

  let group: ColumnMeta | undefined = comparisonGroup;
  let metric: ColumnMeta | undefined;
  let second: ColumnMeta | undefined;

  const isGroupable = (c: ColumnMeta) => c.kind === "categorical" || c.ordinal || c.kind === "numeric";
  const isMetric = (c: ColumnMeta) => c.kind === "numeric" || c.ordinal;

  if (goreIdx > 0) {
    const before = free.filter((m) => m.end <= goreIdx + 1 && isGroupable(m.column));
    const g = before[before.length - 1];
    if (g && !group) group = g.column;
    const rest = free.filter((m) => m !== g && m.column.name !== group?.name);
    metric = rest.find((m) => isMetric(m.column))?.column ?? rest.find((m) => m.column.binary)?.column;
    second = rest.find((m) => m.column.kind === "categorical" && m.column.name !== metric?.name)?.column;
  } else {
    const cats = free.filter((m) => m.column.kind === "categorical" && !m.column.binary);
    const nums = free.filter((m) => isMetric(m.column));
    const bins = free.filter((m) => m.column.binary);
    if (!group) group = cats[0]?.column;
    second = cats.find((m) => m.column.name !== group?.name)?.column;
    metric = nums[0]?.column ?? bins[0]?.column;
    // "kademeye göre" without göre: a lone ordinal plus a categorical → ordinal is the metric
    if (!metric && !group && free.length) group = free[0].column;
  }

  const numericFree = free.filter((m) => isMetric(m.column) && m.column.name !== group?.name);

  /* ---- aggregation word --------------------------------------- */
  let agg: Agg = "mean";
  if (hasFree(RE.median)) agg = "median";
  else if (hasFree(RE.sum)) agg = "sum";
  else if (hasFree(RE.max)) agg = "max";
  else if (hasFree(RE.min) && !filters.some((f) => f.op === "gte")) agg = "min";
  else if (hasFree(RE.mean)) agg = "mean";
  else if (hasFree(RE.count) && !metric) agg = "count";
  const desc = agg !== "min";

  const a: Analysis = { ...base, filters, group, metric, second, agg, n, desc, pct: hasFree(RE.rate) };

  /* ---- intent ------------------------------------------------- */
  if (hasFree(RE.describe) && !metric && !group) return { ...a, intent: "describe" };

  if (numericFree.length >= 2 && (hasFree(RE.corr) || (hasFree(/\bile\b/) && !group))) {
    return { ...a, intent: "correlation", metric: numericFree[0].column, second: numericFree[1].column, group: undefined };
  }
  if (metric?.kind === "numeric" && !metric.ordinal && hasFree(RE.corr) && group?.kind === "numeric") {
    return { ...a, intent: "correlation", metric: group, second: metric, group: undefined };
  }

  const binaryTarget = metric?.binary ? metric : free.find((m) => m.column.binary && m.column.name !== group?.name)?.column;
  if (hasFree(RE.rate) && binaryTarget) return { ...a, intent: "rate", metric: binaryTarget };

  if (hasFree(RE.dist) || (hasFree(RE.rate) && !metric)) {
    if (group && second) return { ...a, intent: "crosstab" };
    if (group && metric && isMetric(metric)) return { ...a, intent: "groupby", agg: agg === "count" ? "mean" : agg };
    if (group && metric?.kind === "categorical") return { ...a, intent: "crosstab", second: metric };
    if (metric && isMetric(metric)) return { ...a, intent: "distribution" };
    if (group) return { ...a, intent: "distribution", metric: group, group: undefined };
    if (second) return { ...a, intent: "distribution", metric: second, group: undefined };
  }

  if (binaryTarget && !metric?.kind.match(/numeric/) && !group && !hasFree(RE.count)) return { ...a, intent: "rate", metric: binaryTarget };

  if (group && second && !metric) return { ...a, intent: "crosstab" };

  if (metric && isMetric(metric) && !group && (agg === "max" || agg === "min") && (n !== undefined || hasFree(RE.list) || hasFree(/\bkim\b|kimler|hangi/))) {
    return { ...a, intent: "top", n: n ?? 5 };
  }

  if (group) {
    if (metric && isMetric(metric)) return { ...a, intent: "groupby", agg: agg === "count" ? "mean" : agg };
    if (metric?.binary) return { ...a, intent: "rate" };
    return { ...a, intent: "groupby", agg: "count" };
  }

  if (metric && isMetric(metric)) {
    if (agg === "max" || agg === "min") return { ...a, intent: "top", n: n ?? 5 };
    if (agg === "count" || hasFree(RE.count)) return { ...a, intent: "count" };
    return { ...a, intent: "aggregate" };
  }

  if (hasFree(RE.count) || filters.length) return { ...a, intent: "count" };
  if (metric?.binary) return { ...a, intent: "rate" };

  return { ...a, intent: "fallback" };
}

function nearestNumericMention(mentions: Mention[], pos: number, window: number): Mention | null {
  let best: Mention | null = null;
  let bestDist = Infinity;
  for (const m of mentions) {
    if (!(m.column.kind === "numeric" || m.column.ordinal)) continue;
    const dist = pos >= m.end ? pos - m.end + 1 : m.start - pos;
    const penalised = pos < m.start ? dist + 0.5 : dist; // prefer the column mentioned before the number
    if (dist <= window && penalised < bestDist) {
      bestDist = penalised;
      best = m;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Execution                                                           */
/* ------------------------------------------------------------------ */

export function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  if (!filters.length) return rows;
  return rows.filter((r) =>
    filters.every((f) => {
      const v = r[f.column.name];
      switch (f.op) {
        case "eq": return String(v) === String(f.value);
        case "neq": return String(v) !== String(f.value);
        case "in": return (f.values ?? []).some((x) => String(x) === String(v));
        case "gt": return typeof v === "number" && v > (f.value as number);
        case "gte": return typeof v === "number" && v >= (f.value as number);
        case "lt": return typeof v === "number" && v < (f.value as number);
        case "lte": return typeof v === "number" && v <= (f.value as number);
        case "between": return typeof v === "number" && v >= (f.lo ?? -Infinity) && v <= (f.hi ?? Infinity);
      }
    }),
  );
}

const OP_SYMBOL: Record<FilterOp, string> = { eq: "=", neq: "≠", in: "∈", gt: ">", gte: "≥", lt: "<", lte: "≤", between: "∈" };

export function describeFilters(filters: Filter[]): string {
  return filters
    .map((f) => {
      if (f.op === "in") return `${f.column.name}: ${(f.values ?? []).map(String).join(" / ")}`;
      if (f.op === "between") return `${f.column.name} ${fmtNum(f.lo ?? 0)}–${fmtNum(f.hi ?? 0)}`;
      if (f.op === "eq") return `${f.column.name} = ${String(f.value)}`;
      return `${f.column.name} ${OP_SYMBOL[f.op]} ${typeof f.value === "number" ? fmtNum(f.value) : String(f.value)}`;
    })
    .join(", ");
}

const AGG_LABEL: Record<Agg, string> = { mean: "Ortalama", sum: "Toplam", median: "Medyan", max: "En Yüksek", min: "En Düşük", count: "Sayı" };

function fmtVal(col: ColumnMeta | undefined, n: number, agg?: Agg): string {
  if (!Number.isFinite(n)) return "—";
  if (agg === "count") return fmtNum(n, 0);
  if (col?.money) return fmtMoney(agg === "mean" || agg === "median" ? round(n, 2) : n);
  if (col?.percent) return fmtPct(n, Number.isInteger(n) ? 0 : 1);
  return fmtNum(n, Number.isInteger(n) ? 0 : 2);
}

/** Table cell for a numeric value: strings for ₺/% so the UI keeps the symbol, numbers otherwise. */
function cellVal(col: ColumnMeta | undefined, n: number, agg?: Agg): string | number {
  if (!Number.isFinite(n)) return "—";
  if (agg === "count") return Math.round(n);
  if (col?.money) return fmtMoney(round(n, 2));
  if (col?.percent) return fmtPct(n, Number.isInteger(n) ? 0 : 1);
  return round(n, 2);
}

function metricLabel(col: ColumnMeta, agg: Agg, unit: string): string {
  return agg === "count" ? `${unit} Sayısı` : `${AGG_LABEL[agg]} ${col.name}`;
}

interface GroupRow {
  key: string;
  sortKey: number | string;
  rows: Row[];
}

/** Group rows by a column; continuous numeric columns are binned into ranges first. */
function groupRows(rows: Row[], col: ColumnMeta): { groups: GroupRow[]; binned: boolean } {
  const map = new Map<string, GroupRow>();
  const binned = col.kind === "numeric" && !col.ordinal;
  if (binned) {
    const nums = numbersOf(rows.map((r) => r[col.name]));
    const bins = histogram(nums, 8, (x) => fmtNum(x));
    for (const b of bins) map.set(b.label, { key: b.label, sortKey: b.lo, rows: [] });
    for (const r of rows) {
      const v = r[col.name];
      if (typeof v !== "number") continue;
      const b = bins.find((x, i) => v >= x.lo && (v < x.hi || i === bins.length - 1));
      if (b) map.get(b.label)!.rows.push(r);
    }
  } else {
    for (const r of rows) {
      const v = r[col.name];
      if (v === null || v === undefined || v === "") continue;
      const key = String(v);
      let g = map.get(key);
      if (!g) {
        g = { key, sortKey: typeof v === "number" ? v : key, rows: [] };
        map.set(key, g);
      }
      g.rows.push(r);
    }
  }
  return { groups: [...map.values()].filter((g) => g.rows.length), binned };
}

const sortByKeyAsc = (a: GroupRow, b: GroupRow) =>
  typeof a.sortKey === "number" && typeof b.sortKey === "number" ? a.sortKey - b.sortKey : String(a.sortKey).localeCompare(String(b.sortKey), "tr");

function chartFor(col: ColumnMeta, binned: boolean, count: number): ChatChart["type"] {
  if (binned || col.temporal || (col.ordinal && count >= 4)) return "line";
  return "bar";
}

function scopeSentence(filters: Filter[], count: number, unit: string): string {
  return filters.length ? `${describeFilters(filters)} ölçütüne uyan ${fmtNum(count)} ${unit.toLowerCase()} için` : "";
}

/* ---- intents ------------------------------------------------------ */

function doGroupBy(rows: Row[], a: Analysis, schema: Schema): ChatResponse {
  const group = a.group!;
  const metric = a.metric;
  const agg: Agg = metric ? a.agg : "count";
  const unit = schema.unit;
  const { groups, binned } = groupRows(rows, group);
  if (!groups.length) return emptyResult(a, schema);

  const values = groups.map((g) => ({
    g,
    value: metric ? aggregate(agg, numbersOf(g.rows.map((r) => r[metric.name]))) : g.rows.length,
    count: g.rows.length,
  }));
  const keepOrder = binned || group.ordinal || group.temporal;
  values.sort((x, y) => (keepOrder ? sortByKeyAsc(x.g, y.g) : a.desc ? y.value - x.value : x.value - y.value));

  const label = metric ? metricLabel(metric, agg, unit) : `${unit} Sayısı`;
  const countLabel = `${unit} Sayısı`;
  const total = rows.length;
  const columns = metric && agg !== "count" ? [group.name, label, countLabel] : [group.name, countLabel, "Pay"];
  const tableRows: ChatTable["rows"] = values.slice(0, MAX_TABLE_ROWS).map((v) =>
    metric && agg !== "count"
      ? [v.g.key, cellVal(metric, v.value, agg), v.count]
      : [v.g.key, v.count, fmtPct((v.count / total) * 100)],
  );

  const isShare = !metric && a.pct;
  const chartType: ChatChart["type"] = !metric && values.length <= 6 && (isShare || !keepOrder) && values.length > 1 ? "pie" : chartFor(group, binned, values.length);
  const yKey = metric && agg !== "count" ? label : countLabel;
  const chart: ChatChart = {
    type: chartType,
    xKey: group.name,
    yKeys: [yKey],
    data: values.slice(0, MAX_TABLE_ROWS).map((v) => ({ [group.name]: v.g.key, [yKey]: round(v.value, metric?.money ? 0 : 2) })),
  };

  const hi = values.reduce((p, c) => (c.value > p.value ? c : p), values[0]);
  const lo = values.reduce((p, c) => (c.value < p.value ? c : p), values[0]);
  const scope = scopeSentence(a.filters, rows.length, unit);
  let reply: string;
  if (metric && agg !== "count") {
    const diff = lo.value ? ((hi.value - lo.value) / Math.abs(lo.value)) * 100 : NaN;
    reply = `${scope ? scope + " " : ""}${group.name} bazında ${AGG_LABEL[agg].toLowerCase()} ${metric.name} en yüksek ${hi.g.key} (${fmtVal(metric, hi.value, agg)}), en düşük ${lo.g.key} (${fmtVal(metric, lo.value, agg)}).`;
    if (values.length > 1 && Number.isFinite(diff) && !keepOrder) reply += ` İkisi arasındaki fark ${fmtPct(diff)}.`;
    else if (keepOrder) reply += ` Grafik ${values.length} kırılımı sıralı olarak gösterir.`;
  } else {
    reply = `${scope ? scope + " " : ""}${group.name} bazında en kalabalık grup ${hi.g.key} (${fmtNum(hi.count)} ${unit.toLowerCase()}, ${fmtPct((hi.count / total) * 100)}); toplam ${fmtNum(values.length)} grup, ${fmtNum(total)} ${unit.toLowerCase()}.`;
    if (values.length > 1) reply += ` En küçük grup ${lo.g.key} (${fmtNum(lo.count)}).`;
  }
  if (values.length > MAX_TABLE_ROWS) reply += ` Tabloda ilk ${MAX_TABLE_ROWS} grup gösteriliyor.`;
  return { reply: capitalize(reply), table: { columns, rows: tableRows }, chart };
}

function doRate(rows: Row[], a: Analysis, schema: Schema): ChatResponse {
  const bin = a.metric!;
  const positive = bin.positive ?? String(bin.distinct[0]);
  const unit = schema.unit;
  const rateLabel = `${bin.name} Oranı (%)`;
  const isPos = (r: Row) => String(r[bin.name]) === positive;
  const scope = scopeSentence(a.filters, rows.length, unit);

  if (!a.group) {
    const pos = rows.filter(isPos).length;
    const rate = rows.length ? (pos / rows.length) * 100 : 0;
    const neg = rows.length - pos;
    const negLabel = String(bin.distinct.find((d) => String(d) !== positive) ?? "Diğer");
    const reply = `${scope ? scope + " " : ""}${bin.name} oranı ${fmtPct(rate)}: ${fmtNum(rows.length)} ${unit.toLowerCase()} içinde ${fmtNum(pos)} "${positive}", ${fmtNum(neg)} "${negLabel}".`;
    return {
      reply: capitalize(reply),
      table: { columns: [bin.name, `${unit} Sayısı`, "Pay"], rows: [[positive, pos, fmtPct(rate)], [negLabel, neg, fmtPct(100 - rate)]] },
      chart: { type: "pie", xKey: bin.name, yKeys: [`${unit} Sayısı`], data: [{ [bin.name]: positive, [`${unit} Sayısı`]: pos }, { [bin.name]: negLabel, [`${unit} Sayısı`]: neg }] },
    };
  }

  const { groups, binned } = groupRows(rows, a.group);
  if (!groups.length) return emptyResult(a, schema);
  const keepOrder = binned || a.group.ordinal || a.group.temporal;
  const values = groups.map((g) => {
    const pos = g.rows.filter(isPos).length;
    return { g, pos, count: g.rows.length, rate: (pos / g.rows.length) * 100 };
  });
  values.sort((x, y) => (keepOrder ? sortByKeyAsc(x.g, y.g) : y.rate - x.rate));
  const overall = (rows.filter(isPos).length / rows.length) * 100;
  const hi = values.reduce((p, c) => (c.rate > p.rate ? c : p), values[0]);
  const lo = values.reduce((p, c) => (c.rate < p.rate ? c : p), values[0]);
  const reply = `${scope ? scope + " " : ""}${bin.name} oranı en yüksek ${hi.g.key} (${fmtPct(hi.rate)}), en düşük ${lo.g.key} (${fmtPct(lo.rate)}); genel oran ${fmtPct(overall)}.`;
  const gName = a.group.name;
  return {
    reply: capitalize(reply),
    table: {
      columns: [gName, rateLabel, `${positive} Sayısı`, `${unit} Sayısı`],
      rows: values.slice(0, MAX_TABLE_ROWS).map((v) => [v.g.key, fmtPct(v.rate), v.pos, v.count]),
    },
    chart: {
      type: chartFor(a.group, binned, values.length),
      xKey: gName,
      yKeys: [rateLabel],
      data: values.slice(0, MAX_TABLE_ROWS).map((v) => ({ [gName]: v.g.key, [rateLabel]: round(v.rate, 1) })),
    },
  };
}

function doDistribution(rows: Row[], a: Analysis, schema: Schema): ChatResponse {
  const col = a.metric!;
  const unit = schema.unit;
  const scope = scopeSentence(a.filters, rows.length, unit);
  const countLabel = `${unit} Sayısı`;

  if (col.kind === "numeric" && !col.ordinal) {
    const nums = numbersOf(rows.map((r) => r[col.name]));
    if (!nums.length) return emptyResult(a, schema);
    const bins = histogram(nums, 9, (x) => fmtNum(x));
    const top = bins.reduce((p, c) => (c.count > p.count ? c : p), bins[0]);
    const m = mean(nums), med = median(nums);
    const reply = `${scope ? scope + " " : ""}${col.name} ${fmtVal(col, Math.min(...nums))} ile ${fmtVal(col, Math.max(...nums))} arasında değişiyor; ortalama ${fmtVal(col, m, "mean")}, medyan ${fmtVal(col, med, "median")}. En yoğun aralık ${top.label} (${fmtNum(top.count)} ${unit.toLowerCase()}, ${fmtPct((top.count / nums.length) * 100)}).`;
    return {
      reply: capitalize(reply),
      table: { columns: [`${col.name} Aralığı`, countLabel, "Pay"], rows: bins.map((b) => [b.label, b.count, fmtPct((b.count / nums.length) * 100)]) },
      chart: { type: "bar", xKey: "Aralık", yKeys: [countLabel], data: bins.map((b) => ({ Aralık: b.label, [countLabel]: b.count })) },
    };
  }

  // categorical / ordinal → value counts
  return doGroupBy(rows, { ...a, group: col, metric: undefined, agg: "count", pct: true, desc: true }, schema);
}

function doCrosstab(rows: Row[], a: Analysis, schema: Schema): ChatResponse {
  const group = a.group!;
  const second = a.second!;
  const unit = schema.unit;
  const { groups, binned } = groupRows(rows, group);
  if (!groups.length) return emptyResult(a, schema);
  const keepOrder = binned || group.ordinal || group.temporal;
  groups.sort(keepOrder ? sortByKeyAsc : (x, y) => y.rows.length - x.rows.length);

  const catCounts = new Map<string, number>();
  for (const r of rows) {
    const v = r[second.name];
    if (v === null || v === undefined || v === "") continue;
    catCounts.set(String(v), (catCounts.get(String(v)) ?? 0) + 1);
  }
  const cats = [...catCounts.entries()].sort((x, y) => y[1] - x[1]).map(([k]) => k).slice(0, 8);

  const table: ChatTable = {
    columns: [group.name, ...cats.map((c) => (a.pct ? `${c} (%)` : c)), `${unit} Sayısı`],
    rows: groups.slice(0, MAX_TABLE_ROWS).map((g) => {
      const counts = cats.map((c) => g.rows.filter((r) => String(r[second.name]) === c).length);
      return [g.key, ...counts.map((n) => (a.pct ? fmtPct((n / g.rows.length) * 100) : n)), g.rows.length];
    }),
  };
  const chart: ChatChart = {
    type: "bar",
    xKey: group.name,
    yKeys: cats,
    data: groups.slice(0, MAX_TABLE_ROWS).map((g) => {
      const rec: Record<string, number | string> = { [group.name]: g.key };
      for (const c of cats) {
        const n = g.rows.filter((r) => String(r[second.name]) === c).length;
        rec[c] = a.pct ? round((n / g.rows.length) * 100, 1) : n;
      }
      return rec;
    }),
  };

  // headline: which group has the highest share of the most common category
  const topCat = cats[0];
  const shares = groups.map((g) => ({ g, share: (g.rows.filter((r) => String(r[second.name]) === topCat).length / g.rows.length) * 100 }));
  const hi = shares.reduce((p, c) => (c.share > p.share ? c : p), shares[0]);
  const lo = shares.reduce((p, c) => (c.share < p.share ? c : p), shares[0]);
  const scope = scopeSentence(a.filters, rows.length, unit);
  const reply = `${scope ? scope + " " : ""}${group.name} bazında ${second.name} dağılımı: "${topCat}" payı en yüksek ${hi.g.key} (${fmtPct(hi.share)}), en düşük ${lo.g.key} (${fmtPct(lo.share)}). Tablo ${fmtNum(groups.length)} grup ve ${fmtNum(cats.length)} kategoriyi gösterir.`;
  return { reply: capitalize(reply), table, chart };
}

function pickDescriptors(schema: Schema, exclude: Set<string>, limit = 3): ColumnMeta[] {
  const hint = /(ad\b|isim|departman|pozisyon|unvan|bolum|cinsiyet|sehir|ulke|kategori|urun|musteri)/;
  return schema.columns
    .filter((c) => c.kind === "categorical" && !c.binary && !exclude.has(c.name))
    .sort((x, y) => Number(hint.test(y.key)) - Number(hint.test(x.key)) || y.distinct.length - x.distinct.length)
    .slice(0, limit);
}

function doTop(rows: Row[], a: Analysis, schema: Schema): ChatResponse {
  const metric = a.metric!;
  const n = Math.min(a.n ?? 5, MAX_TABLE_ROWS);
  const unit = schema.unit;
  const valid = rows.filter((r) => typeof r[metric.name] === "number");
  if (!valid.length) return emptyResult(a, schema);
  const sorted = [...valid].sort((x, y) => (a.desc ? (y[metric.name] as number) - (x[metric.name] as number) : (x[metric.name] as number) - (y[metric.name] as number)));
  const picked = sorted.slice(0, n);
  const idCol = schema.columns.find((c) => c.kind === "id");
  const descriptors = pickDescriptors(schema, new Set([metric.name]));
  const cols = [...(idCol ? [idCol] : []), ...descriptors, metric];
  const table: ChatTable = {
    columns: ["#", ...cols.map((c) => c.name)],
    rows: picked.map((r, i) => [i + 1, ...cols.map((c) => (c === metric ? cellVal(metric, r[metric.name] as number) : (r[c.name] ?? "—") as string | number))]),
  };
  const first = picked[0];
  const who = idCol ? `${idCol.name} ${String(first[idCol.name])}` : `ilk kayıt`;
  const detail = descriptors.map((d) => first[d.name]).filter((v) => v !== null && v !== undefined).map(String).join(", ");
  const dir = a.desc ? "en yüksek" : "en düşük";
  const scope = scopeSentence(a.filters, rows.length, unit);
  const reply = `${scope ? scope + " " : ""}${metric.name} açısından ${dir} ${fmtNum(picked.length)} ${unit.toLowerCase()} listelendi; ilk sırada ${fmtVal(metric, first[metric.name] as number)} ile ${who}${detail ? ` (${detail})` : ""} var.`;
  const yKey = metric.name;
  const xKey = idCol?.name ?? "#";
  return {
    reply: capitalize(reply),
    table,
    chart: {
      type: "bar",
      xKey,
      yKeys: [yKey],
      data: picked.map((r, i) => ({ [xKey]: idCol ? String(r[idCol.name]) : String(i + 1), [yKey]: round(r[metric.name] as number, 2) })),
    },
  };
}

function doCorrelation(rows: Row[], a: Analysis, schema: Schema): ChatResponse {
  const x = a.metric!, y = a.second!;
  const pairs = rows
    .map((r) => [r[x.name], r[y.name]] as const)
    .filter((p): p is readonly [number, number] => typeof p[0] === "number" && typeof p[1] === "number");
  if (pairs.length < 3) return emptyResult(a, schema);
  const r = pearson(pairs.map((p) => p[0]), pairs.map((p) => p[1]));
  const { word, direction } = correlationStrength(r);

  // trend: mean of y across bins of x (a scatter is not renderable in the chat chart set)
  const bins = histogram(pairs.map((p) => p[0]), 8, (v) => fmtNum(v));
  const yLabel = `Ortalama ${y.name}`;
  const trend = bins.map((b, i) => {
    const ys = pairs.filter((p) => p[0] >= b.lo && (p[0] < b.hi || i === bins.length - 1)).map((p) => p[1]);
    return { label: b.label, n: ys.length, y: ys.length ? mean(ys) : NaN };
  }).filter((t) => t.n > 0);

  const unit = schema.unit;
  const scope = scopeSentence(a.filters, rows.length, unit);
  const meaning = Math.abs(r) < 0.1
    ? `İki değişken birlikte hareket etmiyor.`
    : `${x.name} arttıkça ${y.name} ${r > 0 ? "artma" : "azalma"} eğiliminde; grafik ${x.name} aralıklarına göre ortalama ${y.name} değerini gösterir.`;
  const reply = `${scope ? scope + " " : ""}${x.name} ile ${y.name} arasında ${word}${direction ? " " + direction : ""} ilişki var (Pearson r = ${fmtNum(r, 2)}, ${fmtNum(pairs.length)} ${unit.toLowerCase()}). ${meaning}`;
  return {
    reply: capitalize(reply),
    table: {
      columns: [`${x.name} Aralığı`, yLabel, `${unit} Sayısı`],
      rows: trend.map((t) => [t.label, cellVal(y, t.y, "mean"), t.n]),
    },
    chart: { type: "line", xKey: "Aralık", yKeys: [yLabel], data: trend.map((t) => ({ Aralık: t.label, [yLabel]: round(t.y, 2) })) },
  };
}

function doAggregate(rows: Row[], a: Analysis, schema: Schema, allRows: Row[]): ChatResponse {
  const metric = a.metric!;
  const nums = numbersOf(rows.map((r) => r[metric.name]));
  if (!nums.length) return emptyResult(a, schema);
  const unit = schema.unit;
  const agg = a.agg === "count" ? "mean" : a.agg;
  const value = aggregate(agg, nums);
  const allNums = numbersOf(allRows.map((r) => r[metric.name]));
  const allValue = aggregate(agg, allNums);
  const scope = scopeSentence(a.filters, rows.length, unit);
  let reply = `${scope ? scope + " " : ""}${AGG_LABEL[agg].toLowerCase()} ${metric.name} ${fmtVal(metric, value, agg)}${scope ? "" : ` (${fmtNum(nums.length)} ${unit.toLowerCase()})`}.`;
  if (a.filters.length && Number.isFinite(allValue)) {
    const diff = allValue ? ((value - allValue) / Math.abs(allValue)) * 100 : NaN;
    reply += ` Tüm ${unit === "Kişi" ? "çalışanlarda" : "kayıtlarda"} bu değer ${fmtVal(metric, allValue, agg)}${Number.isFinite(diff) ? ` (fark ${diff >= 0 ? "+" : "−"}${fmtPct(Math.abs(diff))})` : ""}.`;
  }
  const table: ChatTable = {
    columns: ["Ölçüt", metric.name],
    rows: [
      [`${unit} Sayısı`, nums.length],
      ["Ortalama", cellVal(metric, mean(nums), "mean")],
      ["Medyan", cellVal(metric, median(nums), "median")],
      ["En Düşük", cellVal(metric, Math.min(...nums))],
      ["En Yüksek", cellVal(metric, Math.max(...nums))],
      ["Std. Sapma", cellVal(metric, std(nums), "mean")],
    ],
  };
  const label = metricLabel(metric, agg, unit);
  const chart: ChatChart | undefined = a.filters.length
    ? {
        type: "bar",
        xKey: "Grup",
        yKeys: [label],
        data: [
          { Grup: "Seçim", [label]: round(value, 2) },
          { Grup: unit === "Kişi" ? "Tüm çalışanlar" : "Tüm kayıtlar", [label]: round(allValue, 2) },
        ],
      }
    : undefined;
  return { reply: capitalize(reply), table, chart };
}

function doCount(rows: Row[], a: Analysis, schema: Schema, allRows: Row[]): ChatResponse {
  const unit = schema.unit;
  if (!a.filters.length) {
    const cats = schema.columns.filter((c) => c.kind === "categorical").length;
    const nums = schema.columns.filter((c) => c.kind === "numeric").length;
    return {
      reply: `Veri setinde ${fmtNum(rows.length)} ${unit === "Kişi" ? "çalışan kaydı" : "kayıt"} ve ${fmtNum(schema.columns.length)} sütun var (${fmtNum(nums)} sayısal, ${fmtNum(cats)} kategorik).`,
    };
  }
  const share = allRows.length ? (rows.length / allRows.length) * 100 : 0;
  const reply = `${describeFilters(a.filters)} ölçütüne uyan ${fmtNum(rows.length)} ${unit.toLowerCase()} var; bu, toplam ${fmtNum(allRows.length)} kaydın ${fmtPct(share)}'i.`;
  const label = `${unit} Sayısı`;
  return {
    reply: capitalize(reply),
    table: { columns: ["Grup", label, "Pay"], rows: [["Seçim", rows.length, fmtPct(share)], ["Diğer", allRows.length - rows.length, fmtPct(100 - share)]] },
    chart: { type: "pie", xKey: "Grup", yKeys: [label], data: [{ Grup: "Seçim", [label]: rows.length }, { Grup: "Diğer", [label]: allRows.length - rows.length }] },
  };
}

function doColumns(schema: Schema): ChatResponse {
  const kindLabel: Record<ColumnMeta["kind"], string> = { numeric: "Sayısal", categorical: "Kategorik", text: "Metin", id: "Kimlik" };
  const rows: ChatTable["rows"] = schema.columns.map((c) => {
    const range = c.kind === "numeric" || c.kind === "id"
      ? `${fmtVal(c, c.min ?? NaN)} – ${fmtVal(c, c.max ?? NaN)}`
      : c.kind === "categorical"
        ? `${fmtNum(c.distinct.length)} değer: ${c.distinct.slice(0, 4).map(String).join(", ")}${c.distinct.length > 4 ? ", …" : ""}`
        : `${fmtNum(c.nonEmpty)} dolu hücre`;
    return [c.name, c.ordinal ? "Sayısal (ölçek)" : kindLabel[c.kind], range];
  });
  const nums = schema.columns.filter((c) => c.kind === "numeric").length;
  const cats = schema.columns.filter((c) => c.kind === "categorical").length;
  return {
    reply: `Veri setinde ${fmtNum(schema.rowCount)} kayıt ve ${fmtNum(schema.columns.length)} sütun var: ${fmtNum(nums)} sayısal, ${fmtNum(cats)} kategorik${schema.columns.length - nums - cats ? `, ${fmtNum(schema.columns.length - nums - cats)} kimlik/metin` : ""}. Tablo her sütunun türünü ve değer aralığını gösterir.`,
    table: { columns: ["Sütun", "Tür", "Değer Aralığı"], rows: rows.slice(0, MAX_TABLE_ROWS) },
  };
}

function doDescribe(rows: Row[], a: Analysis, schema: Schema): ChatResponse {
  const numeric = schema.columns.filter((c) => c.kind === "numeric");
  const table: ChatTable = {
    columns: ["Sütun", "Ortalama", "Medyan", "En Düşük", "En Yüksek", "Std. Sapma"],
    rows: numeric.slice(0, MAX_TABLE_ROWS).map((c) => {
      const xs = numbersOf(rows.map((r) => r[c.name]));
      return [c.name, cellVal(c, mean(xs), "mean"), cellVal(c, median(xs), "median"), cellVal(c, Math.min(...xs)), cellVal(c, Math.max(...xs)), cellVal(c, std(xs), "mean")];
    }),
  };
  const cats = schema.columns.filter((c) => c.kind === "categorical");
  const scope = scopeSentence(a.filters, rows.length, schema.unit);
  const reply = `${scope ? scope + " özet: " : ""}${fmtNum(rows.length)} ${schema.unit.toLowerCase()}, ${fmtNum(numeric.length)} sayısal ve ${fmtNum(cats.length)} kategorik sütun (${cats.slice(0, 4).map((c) => c.name).join(", ")}${cats.length > 4 ? ", …" : ""}). Tablo sayısal sütunların temel istatistiklerini gösterir.`;
  return { reply: capitalize(reply), table };
}

/** Three concrete, answerable questions built from the real column names. */
export function suggestQuestions(schema: Schema): string[] {
  const hint = /(departman|bolum|birim|pozisyon|unvan|sehir|bolge|kategori|urun|musteri)/;
  const cats = schema.columns
    .filter((c) => c.kind === "categorical" && !c.binary)
    .sort((x, y) => Number(hint.test(y.key)) - Number(hint.test(x.key)) || x.distinct.length - y.distinct.length);
  const nums = schema.columns.filter((c) => c.kind === "numeric" && !c.ordinal);
  const money = nums.find((c) => c.money && /(gelir|maas|ciro|tutar)/.test(c.key)) ?? nums.find((c) => c.money) ?? nums[0];
  const other = nums.find((c) => c !== money) ?? nums[0];
  const bin = schema.columns.find((c) => c.binary);
  const out: string[] = [];
  if (cats[0] && money) out.push(`${cats[0].name} bazında ortalama ${money.name}`);
  if (other) out.push(`${other.name} dağılımı`);
  if (bin && cats[1]) out.push(`${cats[1].name} bazında ${bin.name} oranı`);
  else if (money) out.push(`En yüksek ${money.name} olan 5 ${schema.unit.toLowerCase()}`);
  if (out.length < 3 && cats[0]) out.push(`${cats[0].name} bazında ${schema.unit.toLowerCase()} sayısı`);
  if (out.length < 3) out.push("Verideki sütunlar neler?");
  return out.slice(0, 3);
}

function doGreeting(schema: Schema): ChatResponse {
  const s = suggestQuestions(schema);
  return {
    reply: `Merhaba! Yüklü veri setinde ${fmtNum(schema.rowCount)} kayıt ve ${fmtNum(schema.columns.length)} sütun var; ortalama, dağılım, oran, sıralama ve ilişki sorularını Türkçe yanıtlıyorum.\nÖrneğin: ${joinTr(s.map((q) => `"${q}"`))}.`,
  };
}

function doHelp(schema: Schema): ChatResponse {
  const s = suggestQuestions(schema);
  const cats = schema.columns.filter((c) => c.kind === "categorical").slice(0, 4).map((c) => c.name);
  const nums = schema.columns.filter((c) => c.kind === "numeric").slice(0, 4).map((c) => c.name);
  return {
    reply:
      `Şunları yapabilirim: bir kırılıma göre ortalama/toplam/sayı ("X bazında ortalama Y"), dağılım ve histogram, oran/yüzde, en yüksek/en düşük N kayıt, iki sayısal alan arasındaki ilişki, filtreli sorular ("40'tan büyük", "Satış departmanında", "fazla mesai yapanlar").\n` +
      `Kategorik alanlar: ${cats.join(", ")}. Sayısal alanlar: ${nums.join(", ")}.\n` +
      `Deneyin: ${s.map((q) => `"${q}"`).join(" · ")}`,
  };
}

function doFallback(schema: Schema): ChatResponse {
  const s = suggestQuestions(schema);
  return {
    reply: `Bu soruyu verideki sütunlarla eşleştiremedim. Şunları deneyebilirsiniz:\n${s.map((q) => `• ${q}`).join("\n")}\nSütunların tamamı için "Verideki sütunlar neler?" diye sorabilirsiniz.`,
  };
}

function emptyResult(a: Analysis, schema: Schema): ChatResponse {
  const s = suggestQuestions(schema);
  const f = a.filters.length ? ` ${describeFilters(a.filters)} ölçütüne uyan kayıt yok.` : "";
  return { reply: `Bu sorgu için yeterli veri bulunamadı.${f} Şunu deneyebilirsiniz: "${s[0]}".` };
}

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

export function execute(rows: Row[], schema: Schema, a: Analysis): ChatResponse {
  const filtered = applyFilters(rows, a.filters);
  if (!filtered.length && a.intent !== "greeting" && a.intent !== "help" && a.intent !== "columns" && a.intent !== "fallback") {
    return emptyResult(a, schema);
  }
  switch (a.intent) {
    case "greeting": return doGreeting(schema);
    case "help": return doHelp(schema);
    case "columns": return doColumns(schema);
    case "describe": return doDescribe(filtered, a, schema);
    case "count": return doCount(filtered, a, schema, rows);
    case "groupby": return doGroupBy(filtered, a, schema);
    case "rate": return doRate(filtered, a, schema);
    case "distribution": return doDistribution(filtered, a, schema);
    case "crosstab": return doCrosstab(filtered, a, schema);
    case "top": return doTop(filtered, a, schema);
    case "correlation": return doCorrelation(filtered, a, schema);
    case "aggregate": return doAggregate(filtered, a, schema, rows);
    case "fallback": return doFallback(schema);
  }
}

/** Cache schemas per dataset identity so repeated questions don't re-scan the table. */
const schemaCache = new WeakMap<Row[], Schema>();

export function schemaFor(rows: Row[]): Schema {
  let s = schemaCache.get(rows);
  if (!s) {
    s = inferSchema(rows);
    schemaCache.set(rows, s);
  }
  return s;
}

/** Answer a Turkish question over the given rows. */
export function answer(rows: Row[], message: string): ChatResponse {
  if (!rows.length) return { reply: "Yüklü bir veri seti yok. Bir CSV dosyası yükleyin veya örnek veri setinin yüklenmesini bekleyin." };
  const schema = schemaFor(rows);
  const analysis = interpret(message, schema);
  return execute(rows, schema, analysis);
}

export type { Token };
