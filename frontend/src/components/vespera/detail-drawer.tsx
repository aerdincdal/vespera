"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FileText, X } from "lucide-react";
import { useDrawerStore, type DrawerPayload } from "@/store/drawer";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { LinesChart } from "@/components/charts/lines-chart";
import { MatrixTable, autoCell } from "./data-table";
import { DeltaChip } from "./delta-chip";
import { LucideIconByName } from "./lucide-by-name";
import { CountUp } from "./count-up";
import { toneColor } from "./tone";
import { DEMO_OWNERS, DEMO_STATUSES, fmtLike, hashStr, leadingNumber, MONTHS_TR, seededRng, trendSeries } from "@/lib/deterministic";
import { cn } from "@/lib/utils";

const eyebrow = "eyebrow mb-3";

function Sparkline({ seed, end, name, unit }: { seed: string; end?: number; name: string; unit?: string }) {
  const data = useMemo(() => {
    const s = trendSeries(seed, end);
    return MONTHS_TR.map((m, i) => ({ ay: m, [name]: Math.round(s[i] * 10) / 10 }));
  }, [seed, end, name]);
  return <LinesChart data={data} xKey="ay" yKeys={[name]} height={170} unit={unit && unit.length <= 2 ? unit : ""} />;
}

function MiniKpis({ items }: { items: Array<{ label: string; value: string; delta?: string; color?: string }> }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((k, i) => (
        <div key={k.label} className="relative overflow-hidden rounded-xl border border-line bg-white/[0.03] p-3 pl-4">
          <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r" style={{ background: toneColor(k.color, i) }} />
          <div className="line-clamp-2 min-h-[26px] text-[10.5px] uppercase leading-[13px] tracking-[0.08em] text-sand-200/60" title={k.label}>{k.label}</div>
          <div className="tnum mt-1.5 font-serif text-[18px] font-medium leading-none text-sand-50">{k.value}</div>
          {k.delta && <div className="mt-1.5"><DeltaChip delta={k.delta} /></div>}
        </div>
      ))}
    </div>
  );
}

function Footer({ slug, onClose }: { slug?: string; onClose: () => void }) {
  return (
    <div className="mt-auto flex items-center justify-end gap-2 border-t border-line pt-4">
      <button type="button" onClick={onClose} className="btn-glass inline-flex h-9 items-center gap-1.5 px-3.5 text-[13px]">
        <X size={14} strokeWidth={1.75} /> Kapat
      </button>
      <Link href={slug ? `/rapor?from=${encodeURIComponent(slug)}` : "/rapor"} onClick={onClose} className="btn-primary inline-flex h-9 items-center gap-1.5 px-4 text-[13px]">
        <FileText size={14} strokeWidth={1.75} /> Rapor oluştur
      </Link>
    </div>
  );
}

function ToolBody({ p, onClose }: { p: Extract<DrawerPayload, { kind: "tool" }>; onClose: () => void }) {
  const { module: m, tool } = p;
  const seed = `${m.slug}:${tool.title}`;
  const rnd = useMemo(() => seededRng(hashStr(seed)), [seed]);
  const kpis = useMemo(() => {
    const base = m.kpis.length ? m.kpis : [];
    const offset = hashStr(seed) % Math.max(1, base.length);
    const picked = base.length ? [0, 1, 2].map((i) => base[(offset + i) % base.length]) : [];
    if (picked.length === 3 && new Set(picked.map((k) => k.key)).size === 3) {
      return picked.map((k) => ({ label: k.label, value: `${k.value}${k.unit ? ` ${k.unit}` : ""}`, delta: k.delta, color: k.color }));
    }
    return [
      { label: "Kayıt", value: String(Math.round(40 + rnd() * 900)), delta: `+${Math.round(rnd() * 12)}%` },
      { label: "Tamamlanma", value: `${Math.round(60 + rnd() * 38)}%`, delta: `+${(rnd() * 4).toFixed(1)}%` },
      { label: "Ort. Süre", value: `${(1 + rnd() * 6).toFixed(1)} gün`, delta: `-${(rnd() * 9).toFixed(1)}%` },
    ];
  }, [m.kpis, seed, rnd]);
  const table = useMemo(() => {
    const t = m.sections.find((s) => s.type === "table");
    if (t && t.type === "table" && t.rows.length) {
      // 3 columns fit the 520px drawer without horizontal overflow
      const cols = t.columns.slice(0, 3);
      return { title: t.title, columns: cols, rows: t.rows.slice(0, 4).map((r) => r.slice(0, 3)) };
    }
    const r = seededRng(hashStr(seed + ":rows"));
    return {
      title: "Son kayıtlar",
      columns: ["Kayıt", "Sorumlu", "Değer", "Durum"],
      rows: [0, 1, 2, 3].map((i) => [`${m.slug.slice(0, 3).toUpperCase()}-${2400 + Math.floor(r() * 500) + i}`, DEMO_OWNERS[Math.floor(r() * DEMO_OWNERS.length)], Math.round(r() * 9000) / 10, DEMO_STATUSES[Math.floor(r() * DEMO_STATUSES.length)]]),
    };
  }, [m.sections, m.slug, seed]);
  return (
    <>
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-white/[0.04] text-sand-300">
          <LucideIconByName name={tool.icon ?? "sparkles"} size={19} />
        </span>
        <div className="min-w-0">
          <SheetTitle className="font-serif text-[21px] font-medium leading-tight text-sand-50">{tool.title}</SheetTitle>
          <SheetDescription className="mt-1 text-[13px] text-ink-muted">{tool.description}</SheetDescription>
          <div className="mt-2 text-[11px] uppercase tracking-[0.08em] text-sand-200/50">{m.title}</div>
        </div>
      </div>
      <section className="mt-6">
        <div className={eyebrow}>Özet</div>
        <MiniKpis items={kpis} />
      </section>
      <section className="mt-6">
        <div className={eyebrow}>12 aylık eğilim</div>
        <Sparkline seed={seed} name={tool.title.length > 22 ? "Değer" : tool.title} />
      </section>
      <section className="mt-6">
        <div className={eyebrow}>{table.title}</div>
        <MatrixTable columns={table.columns} rows={table.rows} dense />
      </section>
      <Footer slug={m.slug} onClose={onClose} />
    </>
  );
}

function KpiBody({ p, onClose }: { p: Extract<DrawerPayload, { kind: "kpi" }>; onClose: () => void }) {
  const { kpi } = p;
  const end = leadingNumber(kpi.value);
  const seed = `${p.slug ?? p.context ?? ""}:${kpi.key}:${kpi.label}`;
  const series = useMemo(() => trendSeries(seed, end), [seed, end]);
  const rows = useMemo(
    () => [8, 9, 10, 11].map((i) => {
      const prev = series[i - 1];
      const d = prev ? ((series[i] - prev) / Math.abs(prev)) * 100 : 0;
      return [MONTHS_TR[i], fmtLike(kpi.value, series[i]), `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`];
    }),
    [series, kpi.value],
  );
  const color = toneColor(kpi.color, 0);
  return (
    <>
      <div className="flex items-start gap-3.5">
        {kpi.icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-white/[0.04]" style={{ color }}>
            <LucideIconByName name={kpi.icon} size={19} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <SheetDescription className="eyebrow">{kpi.label}</SheetDescription>
          <SheetTitle className="mt-2 flex items-baseline gap-2 font-serif text-[34px] font-medium leading-none text-sand-50">
            <CountUp value={kpi.value} className="tnum" />
            {kpi.unit && <span className="font-sans text-[14px] text-sand-200/80">{kpi.unit}</span>}
          </SheetTitle>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-muted">
            {kpi.delta && <DeltaChip delta={kpi.delta} />}
            <span>{kpi.description ?? kpi.deltaLabel ?? "Önceki döneme göre"}</span>
          </div>
        </div>
      </div>
      {p.context && <div className="mt-3 text-[11px] uppercase tracking-[0.08em] text-sand-200/50">{p.context}</div>}
      <section className="mt-6">
        <div className={eyebrow}>12 aylık eğilim</div>
        <Sparkline seed={seed} end={end} name={kpi.label.length > 22 ? "Değer" : kpi.label} unit={kpi.unit} />
      </section>
      <section className="mt-6">
        <div className={eyebrow}>Son 4 ay</div>
        <MatrixTable columns={["Ay", "Değer", "Değişim"]} rows={rows} dense />
      </section>
      <p className="mt-5 text-[12.5px] leading-relaxed text-ink-muted">
        Bu gösterge, bağlı veri kaynaklarından günlük olarak hesaplanır. Canlı kurulumda eşik değerleri, hedefler ve bildirim kuralları kurumunuza göre tanımlanır.
      </p>
      <Footer slug={p.slug} onClose={onClose} />
    </>
  );
}

function RowBody({ p, onClose }: { p: Extract<DrawerPayload, { kind: "row" }>; onClose: () => void }) {
  const primary = String(p.values[0] ?? "");
  return (
    <>
      <SheetDescription className="eyebrow">{p.title}</SheetDescription>
      <SheetTitle className="mt-2 font-serif text-[22px] font-medium leading-tight text-sand-50">{primary || "Kayıt detayı"}</SheetTitle>
      {p.context && <div className="mt-1 text-[12px] text-ink-muted">{p.context}</div>}
      <dl className="mt-6 divide-y divide-[rgba(196,178,141,0.08)] rounded-2xl border border-line bg-white/[0.02]">
        {p.columns.map((c, i) => (
          <div key={c} className="flex items-start justify-between gap-4 px-4 py-3 text-[13px]">
            <dt className="shrink-0 text-ink-muted">{c}</dt>
            <dd className={cn("min-w-0 text-right text-sand-50", typeof p.values[i] === "number" && "tnum")}>{autoCell(p.values[i], { status: /durum|performans/i.test(c), priority: /öncelik|şiddet|seviye/i.test(c) })}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-6">
        <div className={eyebrow}>Geçmiş</div>
        <Sparkline seed={`${p.title}:${primary}`} name="Değer" />
      </section>
      <Footer slug={p.slug} onClose={onClose} />
    </>
  );
}

function IndicatorBody({ p, onClose }: { p: Extract<DrawerPayload, { kind: "indicator" }>; onClose: () => void }) {
  const color = toneColor(p.color, 0);
  const seed = `indicator:${p.label}`;
  const target = Math.min(100, Math.round(p.value + 4 + (hashStr(seed) % 6)));
  return (
    <>
      <SheetDescription className="eyebrow">{p.context ?? "Kritik gösterge"}</SheetDescription>
      <SheetTitle className="mt-2 font-serif text-[22px] font-medium leading-tight text-sand-50">{p.label}</SheetTitle>
      <div className="mt-5 flex items-end justify-between">
        <div className="tnum font-serif text-[40px] font-medium leading-none text-sand-50">{p.value}<span className="font-sans text-[15px] text-sand-200/80"> %</span></div>
        <div className="text-right text-[12.5px] text-ink-muted">Hedef <span className="tnum font-medium text-sand-50">{target}%</span></div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, p.value)}%`, background: color }} />
      </div>
      <section className="mt-6">
        <div className={eyebrow}>12 aylık eğilim</div>
        <Sparkline seed={seed} end={p.value} name={p.label.length > 22 ? "Gerçekleşme" : p.label} unit="%" />
      </section>
      <p className="mt-5 text-[12.5px] leading-relaxed text-ink-muted">
        Hedefe göre gerçekleşme oranı; hedefler ve ağırlıklar kurumunuzun KPI sözlüğüne göre tanımlanır.
      </p>
      <Footer onClose={onClose} />
    </>
  );
}

export function DetailDrawer() {
  const payload = useDrawerStore((s) => s.payload);
  const close = useDrawerStore((s) => s.close);
  return (
    <Sheet open={payload !== null} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent side="right" className="glass-strong vs-safe-top vs-safe-bottom flex w-full flex-col overflow-y-auto overscroll-contain border-line p-5 data-[side=right]:w-full sm:p-6 sm:max-w-[520px] data-[side=right]:sm:max-w-[520px]">
        {payload?.kind === "tool" && <ToolBody p={payload} onClose={close} />}
        {payload?.kind === "kpi" && <KpiBody p={payload} onClose={close} />}
        {payload?.kind === "row" && <RowBody p={payload} onClose={close} />}
        {payload?.kind === "indicator" && <IndicatorBody p={payload} onClose={close} />}
      </SheetContent>
    </Sheet>
  );
}
