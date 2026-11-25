"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Diverging correlation heatmap: copper (negative) -> neutral -> steel (positive). */
function cellColor(v: number): string {
  const a = Math.min(1, Math.abs(v));
  if (v >= 0) return `rgba(127,159,207,${0.08 + a * 0.72})`;
  return `rgba(200,135,90,${0.08 + a * 0.72})`;
}

export function Heatmap({ labels, matrix, className }: { labels: string[]; matrix: number[][]; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div
        className="grid gap-1 text-[11.5px]"
        style={{ gridTemplateColumns: `minmax(90px,auto) repeat(${labels.length}, minmax(56px, 1fr))` }}
        role="table"
        aria-label="Korelasyon matrisi"
      >
        <div />
        {labels.map((l) => (
          <div key={`h-${l}`} className="truncate px-1 pb-1 text-center text-ink-muted" role="columnheader" title={l}>
            {l}
          </div>
        ))}
        {matrix.map((row, i) => (
          <div key={`r-${i}`} className="contents" role="row">
            <div className="flex items-center truncate pr-2 text-sand-100/85" role="rowheader" title={labels[i]}>
              {labels[i]}
            </div>
            {row.map((v, j) => (
              <Tooltip key={`c-${i}-${j}`}>
                <TooltipTrigger
                  render={
                    <div
                      role="cell"
                      tabIndex={0}
                      className="tnum flex h-11 items-center justify-center rounded-lg border border-white/[0.04] font-medium text-sand-50 transition-transform hover:scale-[1.04]"
                      style={{ background: cellColor(v) }}
                    />
                  }
                >
                  {v.toFixed(2)}
                </TooltipTrigger>
                <TooltipContent>
                  {labels[i]} × {labels[j]}: {v.toFixed(2)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-muted">
        <span>-1</span>
        <span className="h-1.5 w-40 rounded-full" style={{ background: "linear-gradient(90deg, rgba(200,135,90,0.8), rgba(255,255,255,0.08), rgba(127,159,207,0.8))" }} />
        <span>+1</span>
        <span className="ml-2">Negatif ilişki bakır, pozitif ilişki çelik mavi.</span>
      </div>
    </div>
  );
}
