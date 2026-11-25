"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { analyticsMock, datasetsMock } from "@/lib/mock";
import { useApi } from "@/lib/use-api";
import type { AnalyticsResponse } from "@/lib/types";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { DataTable } from "@/components/vespera/data-table";
import { LinesChart } from "@/components/charts/lines-chart";
import { Heatmap } from "@/components/charts/heatmap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/vespera/shimmer";
import { cn } from "@/lib/utils";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const TODAY = new Date();
const RANGES = [
  { id: "7g", label: "Son 7 gün", from: iso(daysAgo(6)), to: iso(TODAY), points: 7 },
  { id: "30g", label: "Son 30 gün", from: iso(daysAgo(29)), to: iso(TODAY), points: 30 },
  { id: "3a", label: "Son 3 ay", from: iso(daysAgo(89)), to: iso(TODAY), points: 13 },
  { id: "12a", label: "Son 12 ay", from: iso(daysAgo(364)), to: iso(TODAY), points: 12 },
];

export function AnalyticsView() {
  const { data: datasets } = useApi(api.datasets, datasetsMock);
  const [dataset, setDataset] = useState("uretim");
  const [range, setRange] = useState("30g");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [metric, setMetric] = useState<string | "all">("all");

  const r = RANGES.find((x) => x.id === range) ?? RANGES[1];
  const key = `${dataset}|${range}|${groupBy}`;
  const { data, loading } = useApi<AnalyticsResponse>(
    () => api.analytics(dataset, { from: r.from, to: r.to, groupBy }),
    () => analyticsMock(dataset, groupBy, groupBy === "day" ? r.points : undefined),
    key,
  );

  const yKeys = useMemo(() => (!data ? [] : metric === "all" ? data.metrics : [metric]), [data, metric]);

  return (
    <>
      <PageHeader icon={Search} title="Detaylı Analiz" subtitle="Veri setini, dönemi ve gruplamayı seçin; zaman serisi, özet istatistik ve korelasyon ısı haritası anında güncellenir." />

      <GlassCard hover={false} className="mb-6 flex flex-wrap items-end gap-4 py-4" as="section" aria-label="Analiz filtreleri">
        <Field label="Veri Seti">
          <Select value={dataset} onValueChange={(v) => { setDataset(String(v)); setMetric("all"); }} items={(datasets ?? datasetsMock).map((d) => ({ value: d.id, label: d.label }))}>
            <SelectTrigger className="h-9 w-44 rounded-xl border-line bg-white/[0.04] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent className="glass-strong rounded-xl border-line">
              {(datasets ?? datasetsMock).map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Tarih Aralığı">
          <Select value={range} onValueChange={(v) => setRange(String(v))} items={RANGES.map((x) => ({ value: x.id, label: x.label }))}>
            <SelectTrigger className="h-9 w-40 rounded-xl border-line bg-white/[0.04] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent className="glass-strong rounded-xl border-line">
              {RANGES.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Gruplama">
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
            <TabsList className="h-9 rounded-xl border border-line bg-white/[0.04] p-1">
              <TabsTrigger value="day" className="rounded-lg px-3 text-[12.5px] data-active:bg-[rgba(196,178,141,0.16)]">Gün</TabsTrigger>
              <TabsTrigger value="week" className="rounded-lg px-3 text-[12.5px] data-active:bg-[rgba(196,178,141,0.16)]">Hafta</TabsTrigger>
              <TabsTrigger value="month" className="rounded-lg px-3 text-[12.5px] data-active:bg-[rgba(196,178,141,0.16)]">Ay</TabsTrigger>
            </TabsList>
          </Tabs>
        </Field>
        {data && (
          <Field label="Metrik" className="ml-auto">
            <div className="flex flex-wrap gap-1.5">
              {["all", ...data.metrics].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  aria-pressed={metric === m}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] transition-colors",
                    metric === m ? "border-sand-300/50 bg-[rgba(196,178,141,0.16)] text-sand-50" : "border-line text-sand-100/75 hover:bg-white/[0.05]",
                  )}
                >
                  {m === "all" ? "Tümü" : m}
                </button>
              ))}
            </div>
          </Field>
        )}
      </GlassCard>

      {loading || !data ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <CardSkeleton className="lg:col-span-12" lines={8} />
          <CardSkeleton className="lg:col-span-7" />
          <CardSkeleton className="lg:col-span-5" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <GlassCard className="lg:col-span-12" as="section">
            <SectionHeader title={`${(datasets ?? datasetsMock).find((d) => d.id === dataset)?.label ?? ""} Zaman Serisi`} subtitle={`${r.label} · ${groupBy === "day" ? "günlük" : groupBy === "week" ? "haftalık" : "aylık"} toplam`} />
            <LinesChart data={data.series} xKey="label" yKeys={yKeys} height={320} />
          </GlassCard>

          <GlassCard className="lg:col-span-7" as="section">
            <SectionHeader title="Özet İstatistikler" subtitle="Seçili dönem için metrik bazında" />
            <DataTable
              mobile={{ title: "metric", badge: "trend" }}
              rows={data.stats}
              rowKey={(s) => s.metric}
              columns={[
                { key: "metric", header: "Metrik", render: (s) => <span className="font-medium text-sand-50">{s.metric}</span> },
                { key: "mean", header: "Ortalama", align: "right" },
                { key: "min", header: "Min", align: "right" },
                { key: "max", header: "Maks", align: "right" },
                { key: "std", header: "Std. Sapma", align: "right" },
                { key: "trend", header: "Trend", align: "right" },
              ]}
            />
          </GlassCard>

          <GlassCard className="lg:col-span-5" as="section">
            <SectionHeader title="Korelasyon Isı Haritası" subtitle="Pearson katsayıları" />
            <Heatmap labels={data.correlation.labels} matrix={data.correlation.matrix} />
          </GlassCard>
        </div>
      )}
    </>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="eyebrow">{label}</div>
      {children}
    </div>
  );
}
