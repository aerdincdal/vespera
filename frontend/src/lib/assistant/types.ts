/** A single table cell as it comes out of JSON or a parsed CSV. */
export type Cell = string | number | null;
/** One record of the active dataset; keys are the (Turkish) column labels. */
export type Row = Record<string, Cell>;

export type ColumnKind = "numeric" | "categorical" | "text" | "id";

export interface ColumnMeta {
  name: string;
  /** folded (lowercase, diacritics-free) name, without unit parentheses */
  key: string;
  /** folded words used for fuzzy matching; hyphenated names yield both split and joined variants */
  wordVariants: string[][];
  kind: ColumnKind;
  /** numeric with few distinct integer values (rating scales, levels) → also usable for grouping */
  ordinal: boolean;
  /** categorical with exactly two values, one of which is a Turkish "yes" */
  binary: boolean;
  /** the "yes" value of a binary column (Evet / Var / 1 …) */
  positive?: string;
  /** name suggests money → format with ₺ */
  money: boolean;
  /** name suggests a percentage → format with % */
  percent: boolean;
  /** name suggests years / time → line charts, ascending sort */
  temporal: boolean;
  distinct: Cell[];
  nonEmpty: number;
  min?: number;
  max?: number;
}

export interface Schema {
  columns: ColumnMeta[];
  rowCount: number;
  /** "Kişi" for HR-like data, otherwise "Kayıt" */
  unit: string;
  byName: Map<string, ColumnMeta>;
}
