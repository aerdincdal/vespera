"use client";

import { cn } from "@/lib/utils";
import { fmtDate, ISO_DATE, deltaSign } from "@/lib/format";
import { StatusBadge, STATUS_WORDS } from "./status-badge";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export type Cell = string | number | React.ReactNode;

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, i: number) => string;
  className?: string;
  dense?: boolean;
  emptyText?: string;
  maxHeight?: number | string;
  statusColumns?: string[];
  priorityColumns?: string[];
  onRowClick?: (row: T, index: number) => void;
  /** Phone layout (< 640px): render rows as stacked cards instead of a scrolling table. */
  mobile?: MobileCards | false;
}

export interface MobileCards {
  /** Column key shown as the card title. Defaults to the first column. */
  title?: string;
  /** Column key rendered next to the title (status / priority badge). */
  badge?: string;
  /** Column key rendered as a right-aligned action row at the bottom of the card. */
  actions?: string;
  /** Column keys that span the full card width (long text, progress bars). */
  wide?: string[];
  /** Column keys omitted on phones. */
  hide?: string[];
}

/** Auto-format primitive cells: ISO dates, +/- deltas, known statuses. */
export function autoCell(value: unknown, opts?: { status?: boolean; priority?: boolean }): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-ink-muted">—</span>;
  if (typeof value === "number") return <span className="tnum">{value.toLocaleString("tr-TR")}</span>;
  if (typeof value !== "string") return value as React.ReactNode;
  if (ISO_DATE.test(value)) return <span className="tnum">{fmtDate(value)}</span>;
  if (opts?.priority) return <StatusBadge status={value} context="priority" />;
  if (opts?.status || STATUS_WORDS.has(value.toLowerCase())) return <StatusBadge status={value} />;
  const sign = deltaSign(value);
  if (sign !== 0 && /^[+-][\d.,]+(%|\s?\w+)?$/.test(value)) {
    const Icon = sign > 0 ? ArrowUpRight : ArrowDownRight;
    return (
      <span className={cn("tnum inline-flex items-center gap-0.5 font-medium", sign > 0 ? "text-ok" : "text-err")}>
        {value}
        <Icon size={13} strokeWidth={1.75} />
      </span>
    );
  }
  if (/^[₺$€]/.test(value) || /^[\d.,]+\s?[₺%]$/.test(value)) return <span className="tnum">{value}</span>;
  return value;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  className,
  dense = false,
  emptyText = "Kayıt bulunamadı.",
  maxHeight,
  statusColumns = [],
  priorityColumns = [],
  onRowClick,
  mobile = false,
}: DataTableProps<T>) {
  const renderCell = (c: Column<T>, row: T, i: number): React.ReactNode => {
    const raw = c.render ? c.render(row, i) : (row as Record<string, unknown>)[c.key];
    return c.render
      ? (raw as React.ReactNode)
      : autoCell(raw, { status: statusColumns.includes(c.key), priority: priorityColumns.includes(c.key) });
  };

  const table = (
    <div className={cn("relative -mx-2 overflow-auto", mobile && "hidden sm:block", className)} style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full border-separate border-spacing-0 text-[13.5px]">
        <thead className={cn(maxHeight && "sticky top-0 z-[1] bg-navy-800/90 backdrop-blur")}>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={cn(
                  "eyebrow whitespace-nowrap px-3 pb-2.5 pt-1 text-left font-semibold hairline-b",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-[13px] text-ink-muted">
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row, i) : i}
              className={cn("vs-row", onRowClick && "vs-row-click cursor-pointer")}
              onClick={onRowClick ? (e) => { if ((e.target as HTMLElement).closest("button,a,input,[role=switch]")) return; onRowClick(row, i); } : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" && e.target === e.currentTarget) onRowClick(row, i); } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
            >
              {columns.map((c) => {
                const content = renderCell(c, row, i);
                return (
                  <td
                    key={c.key}
                    className={cn(
                      "border-b border-[rgba(196,178,141,0.07)] px-3 align-middle text-sand-100/90",
                      dense ? "py-2" : "py-3",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className,
                    )}
                  >
                    {content as React.ReactNode}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!mobile) return table;
  return (
    <>
      <MobileCardList
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        spec={mobile}
        renderCell={renderCell}
        onRowClick={onRowClick}
        emptyText={emptyText}
        maxHeight={maxHeight}
      />
      {table}
    </>
  );
}

function MobileCardList<T>({
  columns,
  rows,
  rowKey,
  spec,
  renderCell,
  onRowClick,
  emptyText,
  maxHeight,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, i: number) => string;
  spec: MobileCards;
  renderCell: (c: Column<T>, row: T, i: number) => React.ReactNode;
  onRowClick?: (row: T, index: number) => void;
  emptyText: string;
  maxHeight?: number | string;
}) {
  const titleKey = spec.title ?? columns[0]?.key;
  const hidden = new Set([titleKey, spec.badge, spec.actions, ...(spec.hide ?? [])].filter(Boolean) as string[]);
  const titleCol = columns.find((c) => c.key === titleKey);
  const badgeCol = spec.badge ? columns.find((c) => c.key === spec.badge) : undefined;
  const actionCol = spec.actions ? columns.find((c) => c.key === spec.actions) : undefined;
  const fields = columns.filter((c) => !hidden.has(c.key));
  const wide = new Set(spec.wide ?? []);

  if (rows.length === 0) {
    return <p className="py-8 text-center text-[13px] text-ink-muted sm:hidden">{emptyText}</p>;
  }
  return (
    <ul
      className={cn("space-y-2.5 sm:hidden", maxHeight && "overflow-y-auto overscroll-contain pr-0.5")}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {rows.map((row, i) => (
        <li
          key={rowKey ? rowKey(row, i) : i}
          className={cn(
            "rounded-2xl border border-[rgba(196,178,141,0.10)] bg-white/[0.025] p-3.5",
            onRowClick && "vs-row-click cursor-pointer transition-colors active:bg-white/[0.06]",
          )}
          onClick={onRowClick ? (e) => { if ((e.target as HTMLElement).closest("button,a,input,[role=switch]")) return; onRowClick(row, i); } : undefined}
          onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" && e.target === e.currentTarget) onRowClick(row, i); } : undefined}
          tabIndex={onRowClick ? 0 : undefined}
        >
          {(titleCol || badgeCol) && (
            <div className="flex items-start justify-between gap-3">
              {titleCol && <div className="min-w-0 break-words text-[14.5px] font-medium leading-snug text-sand-50">{renderCell(titleCol, row, i)}</div>}
              {badgeCol && <div className="shrink-0">{renderCell(badgeCol, row, i)}</div>}
            </div>
          )}
          {fields.length > 0 && (
            <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-2.5", (titleCol || badgeCol) && "mt-3")}>
              {fields.map((c) => (
                <div key={c.key} className={cn("min-w-0", wide.has(c.key) && "col-span-2")}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-sand-200/55">{c.header}</dt>
                  <dd className="mt-0.5 break-words text-[13.5px] leading-snug text-sand-100/90">{renderCell(c, row, i)}</dd>
                </div>
              ))}
            </dl>
          )}
          {actionCol && (
            <div className="mt-3 flex justify-end border-t border-[rgba(196,178,141,0.08)] pt-2.5">{renderCell(actionCol, row, i)}</div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Build a DataTable from a columns/rows matrix (as the API returns for module tables). */
export function MatrixTable({
  columns,
  rows,
  align,
  maxHeight,
  dense,
  priorityColumn,
  progressColumn,
  onRowClick,
  cards,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
  align?: Array<"left" | "right">;
  maxHeight?: number | string;
  dense?: boolean;
  priorityColumn?: string;
  /** Column rendered as a slim sand progress bar with the value beside it (0–100). */
  progressColumn?: string;
  onRowClick?: (values: Array<string | number>, index: number) => void;
  /** Stacked cards on phones. Default: on for tables wider than 3 columns. */
  cards?: boolean;
}) {
  type Row = Record<string, string | number>;
  const data: Row[] = rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
  const inferAlign = (i: number): "left" | "right" =>
    align?.[i] ?? (rows.every((r) => typeof r[i] === "number" || /^[₺$€+-]?[\d.,]+\s?(%|[KM₺]|kez|gün|saat)?$/.test(String(r[i]))) ? "right" : "left");
  // Short cells (ids, codes, dates, numbers) must never wrap; only prose columns may.
  const nowrap = (i: number): boolean => rows.length > 0 && rows.every((r) => String(r[i] ?? "").length <= 20);
  const priorityCols = priorityColumn ? [priorityColumn] : columns.filter((c) => /öncelik/i.test(c));
  const statusCols = columns.filter((c) => /durum|performans/i.test(c));
  const useCards = cards ?? columns.length > 3;
  const badge = [...statusCols, ...priorityCols].find((c) => c !== columns[0]);
  const wideCols = columns.filter((c, i) => c === progressColumn || rows.some((r) => String(r[i] ?? "").length > 22));
  return (
    <DataTable<Row>
      mobile={useCards ? { title: columns[0], badge, wide: wideCols } : false}
      columns={columns.map((c, i) => ({
        key: c,
        header: c,
        align: c === progressColumn ? "left" : inferAlign(i),
        className: nowrap(i) ? "whitespace-nowrap" : undefined,
        width: c === progressColumn ? "160px" : undefined,
        render: c === progressColumn ? (row) => <ProgressCell value={row[c]} /> : undefined,
      }))}
      rows={data}
      maxHeight={maxHeight}
      dense={dense}
      priorityColumns={priorityCols}
      statusColumns={statusCols}
      onRowClick={onRowClick ? (_r, i) => onRowClick(rows[i], i) : undefined}
    />
  );
}

/** Slim sand bar for percentage-like table cells ("68", "68%", 68). */
export function ProgressCell({ value }: { value: string | number | undefined }) {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "").replace("%", "").replace(",", "."));
  if (!Number.isFinite(n)) return <span className="text-ink-muted">—</span>;
  const pct = Math.max(0, Math.min(100, n));
  const tone = pct >= 75 ? "var(--ok)" : pct >= 40 ? "var(--sand-300)" : "var(--copper)";
  return (
    <span className="flex items-center gap-2.5">
      <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: tone }} />
      </span>
      <span className="tnum text-[12.5px] text-sand-100/90">{Number.isInteger(n) ? n : n.toFixed(1)}%</span>
    </span>
  );
}
