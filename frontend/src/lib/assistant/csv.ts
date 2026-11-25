import type { Cell, Row } from "./types";
import { parseTrNumber } from "./text";

export interface ParsedCsv {
  columns: string[];
  rows: Row[];
  delimiter: string;
}

/** Pick the delimiter that splits the header into the most fields (`;` wins ties, as Turkish Excel exports use it). */
function detectDelimiter(headerLine: string): string {
  const candidates = [";", ",", "\t", "|"];
  let best = ";";
  let bestCount = -1;
  for (const d of candidates) {
    const count = splitLine(headerLine, d).length;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Split CSV text into logical lines, honoring quoted newlines. */
function splitRecords(text: string): string[] {
  const records: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') quoted = !quoted;
    if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (cur.trim()) records.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) records.push(cur);
  return records;
}

/**
 * Parse a CSV file in the browser: `;` / `,` / tab autodetect, quoted fields,
 * UTF-8 BOM, Turkish decimals ("1.234,56"). A column becomes numeric when at
 * least 90% of its non-empty cells parse as numbers.
 */
export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/^﻿/, "");
  const lines = splitRecords(clean);
  if (!lines.length) return { columns: [], rows: [], delimiter: "," };
  const delimiter = detectDelimiter(lines[0]);
  const header = splitLine(lines[0], delimiter).map((h, i) => h.trim() || `Sütun ${i + 1}`);
  const raw: string[][] = lines.slice(1).map((l) => splitLine(l, delimiter).map((c) => c.trim()));

  const numericCol = header.map((_, ci) => {
    let nonEmpty = 0;
    let numeric = 0;
    for (const r of raw) {
      const v = r[ci];
      if (v === undefined || v === "") continue;
      nonEmpty++;
      if (parseTrNumber(v) !== null) numeric++;
    }
    return nonEmpty > 0 && numeric / nonEmpty >= 0.9;
  });

  const rows: Row[] = raw.map((r) => {
    const row: Row = {};
    header.forEach((h, ci) => {
      const v = r[ci];
      let cell: Cell = v === undefined || v === "" ? null : v;
      if (cell !== null && numericCol[ci]) {
        const n = parseTrNumber(String(cell));
        cell = n === null ? cell : n;
      }
      row[h] = cell;
    });
    return row;
  });

  return { columns: header, rows, delimiter };
}
