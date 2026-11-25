"use client";

import type { Kpi } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { CountUp } from "./count-up";
import { DeltaChip } from "./delta-chip";
import { toneColor } from "./tone";
import { LucideIconByName } from "./lucide-by-name";
import { openDrawer } from "@/store/drawer";

const INVERT_KEYS = /duruş|gider|devir|kayıp|hata|maliyet|süre|arıza|tüketim|karbon|risk|ppm|mttr|alacak|taşıma|su/i;

export function KpiCard({ kpi, index = 0, className, context, slug }: { kpi: Kpi; index?: number; className?: string; context?: string; slug?: string }) {
  const open = () => openDrawer({ kind: "kpi", kpi, context, slug });
  const color = toneColor(kpi.color, index);
  const invert = INVERT_KEYS.test(kpi.label);
  return (
    <GlassCard
      className={cn("relative cursor-pointer overflow-hidden pl-7 focus-visible:outline-none max-sm:p-4 max-sm:pl-5 max-sm:active:bg-white/[0.04]", className)}
      as="article"
      aria-label={`${kpi.label}, detayları aç`}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
    >
      <span aria-hidden className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r sm:top-5 sm:bottom-5" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {kpi.icon && (
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03] sm:flex" style={{ color }}>
              <LucideIconByName name={kpi.icon} size={16} />
            </span>
          )}
          <span className="eyebrow max-sm:line-clamp-2 max-sm:min-h-[2.6em] max-sm:!text-[10.5px] max-sm:!tracking-[0.06em] max-sm:leading-[1.3]">{kpi.label}</span>
        </div>
        <DeltaChip delta={kpi.delta} invert={invert} className="max-sm:hidden" />
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 sm:mt-4">
        <CountUp value={kpi.value} className="tnum font-serif text-[23px] font-medium leading-none text-sand-50 sm:text-[30px]" />
        {kpi.unit && <span className="text-[12px] text-sand-200/80 sm:text-[13px]">{kpi.unit}</span>}
      </div>
      {kpi.delta && <DeltaChip delta={kpi.delta} invert={invert} className="mt-2.5 sm:hidden" />}
      {(kpi.description || kpi.deltaLabel) && (
        <p className="mt-2 text-[12.5px] text-ink-muted max-sm:line-clamp-2 max-sm:text-[11.5px] max-sm:leading-snug">{kpi.description ?? kpi.deltaLabel}</p>
      )}
    </GlassCard>
  );
}
