/* ------------------------------------------------------------------ */
/*  CSV export tuned for Turkish Excel: UTF-8 BOM + ";" separator.    */
/* ------------------------------------------------------------------ */

import type { ModuleData } from "./types";

export type CsvCell = string | number | boolean | null | undefined;

const SEP = ";";
const BOM = "﻿";

function escapeCell(v: CsvCell): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? String(v).replace(".", ",") : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: string[], rows: CsvCell[][]): string {
  const lines = [columns.map(escapeCell).join(SEP), ...rows.map((r) => r.map(escapeCell).join(SEP))];
  return lines.join("\r\n");
}

/** Several titled blocks in one file, separated by a blank line. */
export function toCsvBlocks(blocks: Array<{ title: string; columns: string[]; rows: CsvCell[][] }>): string {
  return blocks.map((b) => `${escapeCell(b.title)}\r\n${toCsv(b.columns, b.rows)}`).join("\r\n\r\n");
}

export function slugifyFilename(s: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
  return s.replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c] ?? c).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "veri";
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function dateStamp(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Everything tabular in a module — KPIs, tables, cards, progress lists — in one CSV. */
export function moduleToCsv(m: ModuleData): string {
  const blocks: Array<{ title: string; columns: string[]; rows: CsvCell[][] }> = [];
  if (m.kpis.length) {
    blocks.push({ title: "KPI", columns: ["Gösterge", "Değer", "Birim", "Değişim"], rows: m.kpis.map((k) => [k.label, k.value, k.unit ?? "", k.delta ?? ""]) });
  }
  for (const s of m.sections) {
    if (s.type === "table") blocks.push({ title: s.title, columns: s.columns, rows: s.rows });
    else if (s.type === "cards") blocks.push({ title: s.title, columns: ["Başlık", "Değer", "Alt bilgi", "Durum", "İlerleme %", "Not"], rows: s.cards.map((c) => [c.title, c.value, c.subtitle ?? "", c.status ?? "", c.progress ?? "", c.meta ?? ""]) });
    else if (s.type === "progress") blocks.push({ title: s.title, columns: ["Etiket", "Değer"], rows: s.items.map((i) => [i.label, i.value]) });
    else if (s.type === "chart") blocks.push({ title: s.title, columns: [s.xKey, ...s.yKeys], rows: s.data.map((d) => [d[s.xKey], ...s.yKeys.map((k) => d[k])]) });
    else if (s.type === "lines") blocks.push({ title: s.title, columns: ["Etiket", ...s.series.map((x) => x.name)], rows: s.labels.map((l, i) => [l, ...s.series.map((x) => x.data[i])]) });
    else if (s.type === "swot") blocks.push({ title: s.title, columns: ["Bölüm", "Madde"], rows: s.quadrants.flatMap((q) => q.items.map((it) => [q.title, it])) });
  }
  return toCsvBlocks(blocks);
}

export function exportModule(m: ModuleData): void {
  downloadCsv(`vespera-${slugifyFilename(m.slug || m.title)}-${dateStamp()}`, moduleToCsv(m));
}

export function exportTable(name: string, columns: string[], rows: CsvCell[][]): void {
  downloadCsv(`vespera-${slugifyFilename(name)}-${dateStamp()}`, toCsv(columns, rows));
}
