"use client";

import { LayoutDashboard } from "lucide-react";
import { api } from "@/lib/api";
import { dashboardMock } from "@/lib/mock";
import { useApi } from "@/lib/use-api";
import { PageHeader } from "@/components/vespera/page-header";
import { KpiCard } from "@/components/vespera/kpi-card";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { ProgressRow } from "@/components/vespera/progress-row";
import { PageSkeleton } from "@/components/vespera/shimmer";
import { LinesChart } from "@/components/charts/lines-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { CountUp } from "@/components/vespera/count-up";
import { DeltaChip } from "@/components/vespera/delta-chip";
import { LiveStrip } from "./live-strip";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { openDrawer } from "@/store/drawer";

export function DashboardView() {
  const { data, loading } = useApi(api.dashboard, dashboardMock);

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title="Fabrika Performans Analizi"
        subtitle="Tüm hatların, ekiplerin ve kritik göstergelerin bugünkü fotoğrafı."
      />
      {loading || !data ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-6">
          <LiveStrip />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {data.kpis.map((k, i) => <KpiCard key={k.key} kpi={k} index={i} context="Genel Dashboard" />)}
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <GlassCard className="lg:col-span-8" as="section">
              <SectionHeader title="Makine Performansı" subtitle="Üretim Hattı Performansı, saatlik" />
              <LinesChart
                data={data.machineSeries}
                xKey="time"
                yKeys={Object.keys(data.machineSeries[0] ?? {}).filter((k) => k !== "time")}
                domain={[0, 100]}
                height={300}
                colors={["var(--series-2)", "var(--series-3)"]}
              />
            </GlassCard>
            <GlassCard className="lg:col-span-4" as="section">
              <SectionHeader title="Personel Performansı" subtitle="Personel Performans Metrikleri" />
              <DonutChart data={data.personnel} height={220} legend="bottom" unit="" centerLabel="ortalama puan" />
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <GlassCard className="lg:col-span-5" as="section">
              <SectionHeader
                title="Üretim Öngörüleri"
                subtitle="Haftalık üretim projeksiyonu"
                action={
                  <Link href="/tahmin" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] text-sand-200 transition-colors hover:bg-white/[0.06] hover:text-sand-50">
                    AI Öngörü <ArrowUpRight size={13} strokeWidth={1.75} />
                  </Link>
                }
              />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="eyebrow">Bu Hafta</div>
                  <CountUp value={data.forecast.thisWeek} className="tnum mt-2 block font-serif text-[26px] font-medium text-sand-50" />
                </div>
                <div className="text-right">
                  <div className="eyebrow">Gelecek Hafta</div>
                  <CountUp value={data.forecast.nextWeek} className="tnum mt-2 block font-serif text-[26px] font-medium text-steel" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-[12.5px]">
                <span className="flex items-center gap-2 text-ink-muted">
                  Trend <DeltaChip delta={data.forecast.trend} />
                </span>
                <span className="text-ink-muted">
                  Güven Oranı: <span className="tnum font-medium text-sand-50">{data.forecast.confidence}</span>
                </span>
              </div>
            </GlassCard>
            <GlassCard className="lg:col-span-7" as="section">
              <SectionHeader title="Kritik Göstergeler" subtitle="Hedefe göre gerçekleşme" />
              <div className="divide-y divide-[rgba(196,178,141,0.07)]">
                {data.indicators.map((it, i) => <ProgressRow key={it.label} label={it.label} value={it.value} color={it.color} index={i} onClick={() => openDrawer({ kind: "indicator", label: it.label, value: it.value, color: it.color, context: "Kritik Göstergeler" })} />)}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}
