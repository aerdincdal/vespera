"use client";

import type { TooltipContentProps } from "recharts";
import { cn } from "@/lib/utils";

export const GRID = "rgba(196,178,141,0.08)";
export const AXIS_TICK = { fill: "rgba(246,241,231,0.55)", fontSize: 11, fontFamily: "var(--font-manrope)" } as const;
export const CURSOR = { stroke: "rgba(196,178,141,0.25)", strokeWidth: 1 } as const;

type Formatter = (value: number, name: string) => string;

export function GlassTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
}: Omit<Partial<TooltipContentProps<number, string>>, "formatter" | "labelFormatter"> & { valueFormatter?: Formatter; labelFormatter?: (l: unknown) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong min-w-[150px] rounded-xl px-3.5 py-2.5 text-[12.5px] shadow-xl">
      {label !== undefined && (
        <div className="eyebrow mb-1.5 normal-case tracking-normal text-sand-200/80">{labelFormatter ? labelFormatter(label) : String(label)}</div>
      )}
      <ul className="space-y-1">
        {payload.map((p, i) => {
          const name = String(p.name ?? p.dataKey ?? "");
          const value = Number(p.value ?? 0);
          const color = (p.color ?? (p.payload as { fill?: string })?.fill ?? "var(--sand-300)") as string;
          return (
            <li key={`${name}-${i}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sand-100/85">
                <span aria-hidden className="inline-block h-[2px] w-3 rounded-full" style={{ background: color }} />
                {name}
              </span>
              <span className="tnum font-medium text-sand-50">{valueFormatter ? valueFormatter(value, name) : value.toLocaleString("tr-TR")}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ChartLegend({
  items,
  className,
  active,
  onToggle,
}: {
  items: Array<{ name: string; color: string; value?: string }>;
  className?: string;
  active?: Record<string, boolean>;
  onToggle?: (name: string) => void;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-sand-100/80", className)} aria-label="Gösterge">
      {items.map((it) => {
        const on = active ? active[it.name] !== false : true;
        const Tag = onToggle ? "button" : "span";
        return (
          <li key={it.name}>
            <Tag
              {...(onToggle ? { type: "button", onClick: () => onToggle(it.name), "aria-pressed": on } : {})}
              className={cn("inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-opacity", !on && "opacity-40", onToggle && "vs-tap hover:bg-white/[0.04]")}
            >
              <span aria-hidden className="inline-block h-[2px] w-4 rounded-full" style={{ background: it.color }} />
              <span>{it.name}</span>
              {it.value && <span className="tnum text-sand-50">{it.value}</span>}
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}
