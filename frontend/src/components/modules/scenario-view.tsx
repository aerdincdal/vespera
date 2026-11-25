"use client";

import { useEffect, useState } from "react";
import { GitBranch, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { computeScenario, SCENARIO_BASE, SCENARIO_PRESETS } from "@/lib/mock";
import type { ScenarioInput, ScenarioResponse } from "@/lib/types";
import { fmtNumber, fmtTRY } from "@/lib/format";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { Slider } from "@/components/ui/slider";
import { AreaChart } from "@/components/charts/area-chart";
import { CountUp } from "@/components/vespera/count-up";
import { DeltaChip } from "@/components/vespera/delta-chip";
import { GlassButton } from "@/components/vespera/buttons";
import { useOfflineStore } from "@/store/ui";
import { cn } from "@/lib/utils";

const SLIDERS: Array<{ key: keyof ScenarioInput; label: string; min: number; max: number; step: number; unit: string; hint: string }> = [
  { key: "demandChange", label: "Talep Değişimi", min: -30, max: 30, step: 1, unit: "%", hint: "Pazar talebindeki beklenen değişim" },
  { key: "materialPriceChange", label: "Hammadde Fiyatı", min: -20, max: 40, step: 1, unit: "%", hint: "Birim hammadde maliyeti değişimi" },
  { key: "shifts", label: "Vardiya Sayısı", min: 1, max: 3, step: 1, unit: "", hint: "Günlük çalışan vardiya" },
  { key: "energyPriceChange", label: "Enerji Fiyatı", min: -20, max: 50, step: 1, unit: "%", hint: "kWh birim fiyat değişimi" },
];

export function ScenarioView() {
  const [input, setInput] = useState<ScenarioInput>(SCENARIO_PRESETS[1].input);
  const inputKey = JSON.stringify(input);
  const [computed, setComputed] = useState<{ key: string; result: ScenarioResponse }>(() => ({
    key: JSON.stringify(SCENARIO_PRESETS[1].input),
    result: computeScenario(SCENARIO_PRESETS[1].input),
  }));
  const result = computed.result;
  const pending = computed.key !== inputKey;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      let res: ScenarioResponse;
      try {
        res = await api.scenario(input);
      } catch {
        useOfflineStore.getState().setOffline();
        res = computeScenario(input);
      }
      if (!cancelled) setComputed({ key: inputKey, result: res });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);

  const activePreset = SCENARIO_PRESETS.find((p) => JSON.stringify(p.input) === JSON.stringify(input))?.id;
  const pct = (a: number, b: number) => {
    const v = ((a - b) / Math.abs(b || 1)) * 100;
    return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  };

  const cards = [
    { label: "Üretim", base: result.baseline.production, val: result.scenario.production, fmt: (n: number) => `${fmtNumber(n)} birim` },
    { label: "Gelir", base: result.baseline.revenue, val: result.scenario.revenue, fmt: (n: number) => fmtTRY(n, true) },
    { label: "Maliyet", base: result.baseline.cost, val: result.scenario.cost, fmt: (n: number) => fmtTRY(n, true), invert: true },
    { label: "Kâr", base: result.baseline.profit, val: result.scenario.profit, fmt: (n: number) => fmtTRY(n, true) },
  ];

  return (
    <>
      <PageHeader
        icon={GitBranch}
        title="Senaryo Analizi"
        subtitle="Talep, maliyet ve kapasite varsayımlarını değiştirin; sonuçlar baz senaryoyla anında karşılaştırılır."
        actions={
          <GlassButton onClick={() => setInput(SCENARIO_BASE)}>
            <RotateCcw size={14} strokeWidth={1.5} /> Baz değerlere dön
          </GlassButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <GlassCard hover={false} className="lg:col-span-4" as="section">
          <SectionHeader title="Varsayımlar" subtitle="Kaydırıcılar 350 ms gecikmeyle hesaplar" />
          <div className="mb-5 flex gap-2">
            {SCENARIO_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setInput(p.input)}
                aria-pressed={activePreset === p.id}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-[12.5px] font-medium transition-colors",
                  activePreset === p.id ? "border-sand-300/50 bg-[rgba(196,178,141,0.16)] text-sand-50" : "border-line text-sand-100/75 hover:bg-white/[0.05]",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="space-y-6">
            {SLIDERS.map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex items-baseline justify-between">
                  <div>
                    <div className="text-[13.5px] font-medium text-sand-50">{s.label}</div>
                    <div className="text-[11.5px] text-ink-muted">{s.hint}</div>
                  </div>
                  <span className="tnum font-serif text-[18px] text-sand-200">
                    {input[s.key] > 0 && s.unit ? "+" : ""}{input[s.key]}{s.unit}
                  </span>
                </div>
                <Slider
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={[input[s.key]]}
                  onValueChange={(v) => setInput((i) => ({ ...i, [s.key]: Array.isArray(v) ? v[0] : v }))}
                  aria-label={s.label}
                  className="[&_[data-slot=slider-range]]:bg-sand-300 [&_[data-slot=slider-thumb]]:border-sand-300 [&_[data-slot=slider-thumb]]:bg-sand-50 [&_[data-slot=slider-track]]:bg-white/[0.08]"
                />
                <div className="tnum mt-1 flex justify-between text-[10.5px] text-ink-muted">
                  <span>{s.min}{s.unit}</span>
                  <span>{s.max}{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-6 lg:col-span-8">
          <div className={cn("grid grid-cols-2 gap-3 transition-opacity sm:gap-4 xl:grid-cols-4", pending && "opacity-70")}>
            {cards.map((c, i) => (
              <GlassCard key={c.label} className="relative overflow-hidden pl-7 max-sm:p-4 max-sm:pl-5" as="article">
                <span aria-hidden className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r sm:top-5 sm:bottom-5" style={{ background: `var(--series-${i + 1})` }} />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="eyebrow">{c.label}</span>
                  <DeltaChip delta={pct(c.val, c.base)} invert={c.invert} />
                </div>
                <CountUp value={c.fmt(c.val)} className="tnum mt-3 block font-serif text-[21px] font-medium leading-none text-sand-50 sm:mt-4 sm:text-[24px]" />
                <p className="tnum mt-2 text-[12px] text-ink-muted">Baz: {c.fmt(c.base)}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard as="section">
            <SectionHeader title="Baz ve Senaryo Karşılaştırması" subtitle="Aylık kâr projeksiyonu" />
            <AreaChart
              data={result.series.map((s) => ({ month: s.month, Baz: s.baseline, Senaryo: s.scenario }))}
              xKey="month"
              yKeys={["Baz", "Senaryo"]}
              height={300}
              colors={["var(--series-2)", "var(--series-1)"]}
              formatter={(v) => fmtTRY(v, true)}
            />
          </GlassCard>
        </div>
      </div>
    </>
  );
}
