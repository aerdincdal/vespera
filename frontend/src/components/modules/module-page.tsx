"use client";

import { api } from "@/lib/api";
import { emptyModule, modulesMock } from "@/lib/mock/modules";
import { useApi } from "@/lib/use-api";
import type { Section } from "@/lib/types";
import { PageHeader } from "@/components/vespera/page-header";
import { KpiCard } from "@/components/vespera/kpi-card";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { ToolLink } from "@/components/vespera/tool-link";
import { PageSkeleton } from "@/components/vespera/shimmer";
import { LucideIconByName } from "@/components/vespera/lucide-by-name";
import { MatrixTable } from "@/components/vespera/data-table";
import { ProgressRow } from "@/components/vespera/progress-row";
import { StatusBadge } from "@/components/vespera/status-badge";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { LinesChart } from "@/components/charts/lines-chart";
import { CountUp } from "@/components/vespera/count-up";
import { cn } from "@/lib/utils";
import { exportModule } from "@/lib/export";
import { ExportButton } from "@/components/vespera/export-button";
import { openDrawer } from "@/store/drawer";
import type { ModuleData } from "@/lib/types";
import type { LucideProps } from "lucide-react";

function IconFromName(props: { name: string } & LucideProps) {
  return <LucideIconByName {...props} />;
}

export function ModulePage({ slug }: { slug: string }) {
  const fallback = modulesMock[slug] ?? emptyModule(slug);
  const { data, loading } = useApi(() => api.module(slug), fallback, slug);
  const HeaderIcon = (p: LucideProps) => <IconFromName name={data?.icon ?? "box"} {...p} />;

  return (
    <>
      <PageHeader
        icon={HeaderIcon}
        title={data?.title ?? fallback.title}
        subtitle={data?.subtitle ?? fallback.subtitle}
        actions={data && (data.sections.length > 0 || data.kpis.length > 0) ? <ExportButton onExport={() => exportModule(data)} /> : undefined}
      />
      {loading || !data ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {data.kpis.map((k, i) => <KpiCard key={k.key} kpi={k} index={i} slug={slug} context={data.title} />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              {data.sections.map((s, i) => <SectionCard key={`${s.type}-${i}`} section={s} module={data} />)}
            </div>
            <GlassCard className="self-start lg:col-span-4" as="aside" hover={false}>
              <SectionHeader title={data.toolsTitle ?? "Araçlar ve Raporlar"} subtitle="Sık kullanılan araçlar" />
              <div className="-mx-2 space-y-1">
                {data.tools.map((t) => <ToolLink key={t.title} tool={t} onClick={(tool) => openDrawer({ kind: "tool", module: data, tool })} />)}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}

const SWOT_TONE: Record<string, { color: string; ring: string }> = {
  strengths: { color: "var(--ok)", ring: "rgba(127,178,138,0.3)" },
  weaknesses: { color: "var(--err)", ring: "rgba(201,107,107,0.3)" },
  opportunities: { color: "var(--steel)", ring: "rgba(127,159,207,0.3)" },
  threats: { color: "var(--warn)", ring: "rgba(217,184,106,0.3)" },
};

function SectionCard({ section, module: m }: { section: Section; module: ModuleData }) {
  return (
    <GlassCard as="section">
      <SectionHeader title={section.title} />
      {section.type === "table" && (
        <MatrixTable
          columns={section.columns}
          rows={section.rows}
          align={section.align}
          progressColumn={section.progressColumn}
          onRowClick={(values) => openDrawer({ kind: "row", title: section.title, columns: section.columns, values, slug: m.slug, context: m.title })}
        />
      )}

      {section.type === "cards" && (
        <div className={cn("grid gap-4", section.cards.length > 4 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2")}>
          {section.cards.map((c, i) => (
            <button
              type="button"
              key={c.title}
              onClick={() => openDrawer({ kind: "row", title: section.title, columns: ["Başlık", "Değer", ...(c.subtitle ? ["Birim"] : []), ...(c.status ? ["Durum"] : []), ...(typeof c.progress === "number" ? ["İlerleme"] : []), ...(c.meta ? ["Not"] : [])], values: [c.title, c.value, ...(c.subtitle ? [c.subtitle] : []), ...(c.status ? [c.status] : []), ...(typeof c.progress === "number" ? [`${c.progress}%`] : []), ...(c.meta ? [c.meta] : [])], slug: m.slug, context: m.title })}
              className="relative overflow-hidden rounded-2xl border border-line bg-white/[0.03] p-4 pl-5 text-left transition-colors hover:border-line-strong hover:bg-white/[0.05]"
            >
              <span aria-hidden className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r bg-steel" style={{ opacity: 0.9 - (i % 3) * 0.15 }} />
              <div className="flex items-start justify-between gap-3">
                <div className="text-[14px] font-semibold text-sand-50">{c.title}</div>
                {c.status && <StatusBadge status={c.status} />}
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <CountUp value={c.value} className="tnum font-serif text-[24px] font-medium leading-none text-sand-50" />
                {c.subtitle && <span className="text-[12px] text-ink-muted">{c.subtitle}</span>}
              </div>
              {typeof c.progress === "number" && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuenow={c.progress} aria-valuemin={0} aria-valuemax={100}>
                  <span className="block h-full rounded-full bg-sand-300 transition-[width] duration-700" style={{ width: `${c.progress}%` }} />
                </div>
              )}
              {c.meta && <div className="tnum mt-2 text-[12px] text-ink-muted">{c.meta}</div>}
            </button>
          ))}
        </div>
      )}

      {section.type === "progress" && (
        <div className="divide-y divide-[rgba(196,178,141,0.07)]">
          {section.items.map((it, i) => <ProgressRow key={it.label} label={it.label} value={it.value} color={it.color} index={i} onClick={() => openDrawer({ kind: "indicator", label: it.label, value: it.value, color: it.color, context: section.title })} />)}
        </div>
      )}

      {section.type === "lines" && (
        <LinesChart
          data={section.labels.map((l, i) => Object.fromEntries([["label", l], ...section.series.map((s) => [s.name, s.data[i]])]))}
          xKey="label"
          yKeys={section.series.map((s) => s.name)}
        />
      )}

      {section.type === "chart" && section.chartType === "area" && (
        <AreaChart data={section.data} xKey={section.xKey} yKeys={section.yKeys} unit={section.unit ? ` ${section.unit}` : ""} formatter={section.unit === "₺M" ? (v) => `₺${v.toFixed(1)}M` : undefined} />
      )}
      {section.type === "chart" && section.chartType === "bar" && <BarChart data={section.data} xKey={section.xKey} yKeys={section.yKeys} unit={section.unit ?? ""} />}
      {section.type === "chart" && section.chartType === "line" && <LinesChart data={section.data} xKey={section.xKey} yKeys={section.yKeys} unit={section.unit ?? ""} />}

      {section.type === "swot" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {section.quadrants.map((q) => {
            const t = SWOT_TONE[q.key] ?? SWOT_TONE.strengths;
            return (
              <div key={q.key} className="rounded-2xl border p-4" style={{ borderColor: t.ring, background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                  <h3 className="font-serif text-[15px] font-medium text-sand-50">{q.title}</h3>
                </div>
                <ul className="mt-3 space-y-2 text-[13px] text-sand-100/85">
                  {q.items.map((it) => (
                    <li key={it} className="flex gap-2.5">
                      <span aria-hidden className="mt-[9px] h-px w-3 shrink-0" style={{ background: t.color }} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
