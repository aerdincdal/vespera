"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChartScatter, Download, FileDown, LayoutGrid, Check } from "lucide-react";
import { api } from "@/lib/api";
import { analyticsMock, datasetsMock, modulesMock } from "@/lib/mock";
import { useApi, tryApi, newId } from "@/lib/use-api";
import { leadingNumber } from "@/lib/deterministic";
import { exportTable } from "@/lib/export";
import type { Widget } from "@/lib/types";
import { useStudioWidgets, type StudioChartType, type StudioConfig, type StudioAgg } from "@/store/studio";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { GlassButton, PrimaryButton } from "@/components/vespera/buttons";
import { CardSkeleton } from "@/components/vespera/shimmer";
import { SERIES } from "@/components/vespera/tone";
import { StudioChart, aggregateRows, type Row } from "@/components/charts/studio-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CHART_TYPES: Array<{ id: StudioChartType; label: string }> = [
  { id: "line", label: "Çizgi" }, { id: "area", label: "Alan" }, { id: "bar", label: "Çubuk" }, { id: "hbar", label: "Yatay Çubuk" },
  { id: "pie", label: "Pasta" }, { id: "scatter", label: "Dağılım" }, { id: "heatmap", label: "Isı Haritası" },
];
const AGGS: Array<{ id: StudioAgg; label: string }> = [{ id: "sum", label: "Toplam" }, { id: "avg", label: "Ortalama" }, { id: "count", label: "Adet" }];
const PALETTE_NAMES = ["Bej", "Çelik", "Bakır", "Adaçayı", "Gül", "Lavanta"];
const WIDGET_TYPE: Record<StudioChartType, Widget["type"]> = { line: "chart", area: "chart", scatter: "chart", bar: "bar", hbar: "bar", pie: "pie", heatmap: "table" };

/** Module table sections exposed as data sources ("module:<slug>:<sectionIndex>"). */
const MODULE_TABLES = Object.values(modulesMock).flatMap((m) =>
  m.sections.map((s, i) => (s.type === "table" && s.rows.length >= 3 ? { id: `module:${m.slug}:${i}`, label: `${m.title.replace(/ (Merkezi|Yönetimi|Paneli)$/i, "")} · ${s.title}`, slug: m.slug, index: i } : null)).filter((x): x is NonNullable<typeof x> => x !== null),
);

/** Table matrix → records; columns that parse as numbers on every row become numeric. */
function tableToRows(columns: string[], rows: Array<Array<string | number>>): Row[] {
  const numericCol = columns.map((_, i) => rows.every((r) => leadingNumber(r[i]) !== undefined && !/^\d{4}-\d{2}-\d{2}/.test(String(r[i]))));
  return rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, numericCol[i] ? (leadingNumber(r[i]) ?? 0) : r[i]])));
}

const DEFAULT: StudioConfig = {
  source: "analytics:uretim", chartType: "line", xKey: "label", yKeys: [], agg: "sum", paletteStart: 0,
  grid: true, legend: true, labels: false, smooth: true, title: "Üretim Eğilimi", subtitle: "Aylık üretim adedi ve OEE",
};

export function StudioView() {
  const [cfg, setCfg] = useState<StudioConfig>(DEFAULT);
  const set = (patch: Partial<StudioConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const { data: datasets } = useApi(api.datasets, datasetsMock);
  const dsList = datasets?.length ? datasets : datasetsMock;

  const [kind, ref, idx] = cfg.source.split(":");
  const modTable = MODULE_TABLES.find((t) => t.id === cfg.source);

  const { data: analytics, loading: loadingA } = useApi(
    () => (kind === "analytics" ? api.analytics(ref, { groupBy: "month" }) : Promise.reject(new Error("n/a"))),
    () => analyticsMock(ref, "month"),
    `studio:${cfg.source}`,
  );
  const { data: moduleData, loading: loadingM } = useApi(
    () => (kind === "module" ? api.module(ref) : Promise.reject(new Error("n/a"))),
    () => modulesMock[ref],
    `studio-mod:${cfg.source}`,
  );
  const loading = kind === "analytics" ? loadingA : loadingM;

  const rows: Row[] = useMemo(() => {
    if (kind === "analytics") return (analytics?.series ?? []) as Row[];
    const sec = moduleData?.sections[Number(idx)];
    if (sec && sec.type === "table") return tableToRows(sec.columns, sec.rows);
    const fallback = modulesMock[ref]?.sections[Number(idx)];
    return fallback && fallback.type === "table" ? tableToRows(fallback.columns, fallback.rows) : [];
  }, [kind, analytics, moduleData, ref, idx]);

  const fields = useMemo(() => {
    const first = rows[0] ?? {};
    const keys = Object.keys(first);
    const numeric = keys.filter((k) => rows.every((r) => typeof r[k] === "number"));
    const categorical = keys.filter((k) => !numeric.includes(k));
    return { keys, numeric, categorical };
  }, [rows]);

  // Effective config: user choices where valid for this source, sensible defaults otherwise.
  // Derived (not synced with an effect) so a source change never triggers a setState cascade.
  const [titleAuto, setTitleAuto] = useState(true);
  const eff = useMemo<StudioConfig>(() => {
    const xOk = fields.keys.includes(cfg.xKey);
    const x = xOk ? cfg.xKey : fields.categorical[0] ?? fields.keys[0] ?? cfg.xKey;
    const ys = cfg.yKeys.filter((y) => fields.numeric.includes(y));
    const y = ys.length ? ys : fields.numeric.filter((k) => k !== x).slice(0, 1);
    const label = kind === "analytics" ? dsList.find((d) => d.id === ref)?.label : modTable?.label;
    const title = titleAuto ? (label ?? cfg.title) : cfg.title;
    const subtitle = titleAuto ? (y.length ? `${y.join(", ")} · ${x === "label" ? "dönem" : x} bazında` : cfg.subtitle) : cfg.subtitle;
    return { ...cfg, xKey: x, yKeys: y, title, subtitle };
  }, [cfg, fields, kind, ref, dsList, modTable, titleAuto]);

  const previewRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const addStudio = useStudioWidgets((s) => s.add);
  const [saved, setSaved] = useState(false);

  async function saveWidget() {
    const type = WIDGET_TYPE[eff.chartType];
    const title = eff.title.trim() || "Stüdyo grafiği";
    const local: Widget = { id: newId("studio"), title, type, typeLabel: type === "chart" ? "Grafik" : type === "bar" ? "Sütun" : type === "pie" ? "Pasta" : "Tablo", size: "wide", sizeLabel: "Geniş", enabled: true, order: 99 };
    const { result } = await tryApi(() => api.widgetAdd({ title, type, size: "wide" }), () => local);
    const w = { ...local, ...result, title };
    addStudio({ ...w, studio: { ...eff, title }, data: aggregateRows(rows, eff.xKey, eff.yKeys, eff.agg) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
    toast.success("Widget kaydedildi", { description: `"${title}" Kişisel Dashboard'a eklendi.`, action: { label: "Görüntüle", onClick: () => router.push("/kisisel") } });
  }

  function downloadCsv() {
    const data = aggregateRows(rows, eff.xKey, eff.yKeys, eff.agg);
    exportTable(eff.title || "grafik", [eff.xKey, ...eff.yKeys], data.map((d) => [d[eff.xKey], ...eff.yKeys.map((k) => d[k])]));
    toast("CSV indiriliyor");
  }

  async function downloadPng() {
    const host = previewRef.current;
    const svg = host?.querySelector("svg.recharts-surface") as SVGSVGElement | null;
    if (!svg) {
      toast.error("PNG için bir grafik gerekli", { description: "Isı haritası ve boş görünüm PNG olarak dışa aktarılamaz; CSV kullanın." });
      return;
    }
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      // Inline the computed colors: CSS variables don't resolve inside an <img>-rendered SVG.
      const src = svg.querySelectorAll<SVGElement>("*");
      const dst = clone.querySelectorAll<SVGElement>("*");
      src.forEach((el, i) => {
        const cs = getComputedStyle(el);
        const d = dst[i];
        if (!d) return;
        for (const prop of ["stroke", "fill", "stroke-width", "stroke-opacity", "fill-opacity", "font-size", "opacity"] as const) {
          const v = cs.getPropertyValue(prop);
          if (v && v !== "none" || prop === "fill") d.setAttribute(prop, v || "none");
        }
        d.setAttribute("font-family", "Manrope, Helvetica, Arial, sans-serif");
      });
      const w = svg.clientWidth || 800, h = svg.clientHeight || 400;
      clone.setAttribute("width", String(w)); clone.setAttribute("height", String(h));
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("svg")); img.src = url; });
      const scale = 2, pad = 48, header = 88;
      const canvas = document.createElement("canvas");
      canvas.width = (w + pad * 2) * scale; canvas.height = (h + pad * 2 + header) * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height / scale);
      g.addColorStop(0, "#0b1528"); g.addColorStop(1, "#070e1c");
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f6f1e7"; ctx.font = "500 24px Fraunces, Georgia, serif"; ctx.fillText(eff.title || "Grafik", pad, pad + 8);
      ctx.fillStyle = "rgba(246,241,231,0.6)"; ctx.font = "13px Manrope, Helvetica, sans-serif"; ctx.fillText(eff.subtitle || "", pad, pad + 34);
      ctx.fillStyle = "rgba(196,178,141,0.7)"; ctx.font = "11px Manrope, Helvetica, sans-serif"; ctx.fillText("VESPERA · App On Inc.", pad, h + pad + header - 4);
      ctx.drawImage(img, pad, pad + header - 24, w, h);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `${(eff.title || "grafik").toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, "-")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast("PNG indiriliyor");
    } catch {
      toast.error("PNG üretilemedi", { description: "Tarayıcı SVG dönüştürmeyi engelledi; CSV dışa aktarımını deneyin." });
    }
  }

  // Human labels for Select values (base-ui renders `items[value]` inside SelectValue).
  const sourceItems = useMemo(() => Object.fromEntries([...dsList.map((d) => [`analytics:${d.id}`, d.label]), ...MODULE_TABLES.map((t) => [t.id, t.label])]), [dsList]);
  const fieldLabel = (k: string) => (k === "label" ? "Dönem" : k);
  const fieldItems = useMemo(() => Object.fromEntries(fields.keys.map((k) => [k, fieldLabel(k)])), [fields.keys]);

  const toggleY = (k: string) => set({ yKeys: eff.yKeys.includes(k) ? eff.yKeys.filter((y) => y !== k) : [...eff.yKeys, k] });

  return (
    <>
      <PageHeader
        icon={ChartScatter}
        title="Görselleştirme Stüdyosu"
        subtitle="Herhangi bir veri kaynağından dakikalar içinde grafik kurun; widget olarak kaydedin, PNG veya CSV indirin."
        actions={
          <>
            <GlassButton onClick={downloadCsv}><FileDown size={14} strokeWidth={1.75} /> CSV indir</GlassButton>
            <GlassButton onClick={() => void downloadPng()}><Download size={14} strokeWidth={1.75} /> PNG indir</GlassButton>
            <PrimaryButton onClick={() => void saveWidget()} disabled={!eff.yKeys.length}>
              {saved ? <Check size={14} strokeWidth={2} /> : <LayoutGrid size={14} strokeWidth={1.75} />} {saved ? "Kaydedildi" : "Widget olarak kaydet"}
            </PrimaryButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <GlassCard hover={false} as="section">
            <SectionHeader title="Veri" subtitle="Kaynak ve alanlar" />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Veri kaynağı</Label>
                <Select value={cfg.source} items={sourceItems} onValueChange={(v) => set({ source: String(v), yKeys: [] })}>
                  <SelectTrigger className="w-full rounded-xl border-line bg-white/[0.04]" aria-label="Veri kaynağı"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong max-h-[360px] rounded-xl border-line">
                    <SelectGroup>
                      <SelectLabel className="eyebrow">Analitik veri setleri</SelectLabel>
                      {dsList.map((d) => <SelectItem key={d.id} value={`analytics:${d.id}`}>{d.label}</SelectItem>)}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="eyebrow">Modül tabloları</SelectLabel>
                      {MODULE_TABLES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>X alanı</Label>
                <Select value={eff.xKey} items={fieldItems} onValueChange={(v) => set({ xKey: String(v) })}>
                  <SelectTrigger className="w-full rounded-xl border-line bg-white/[0.04]" aria-label="X alanı"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl border-line">{fields.keys.map((k) => <SelectItem key={k} value={k}>{fieldLabel(k)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Y alanları <span className="text-ink-muted">(çoklu)</span></Label>
                <div className="flex flex-wrap gap-1.5">
                  {fields.numeric.map((k) => {
                    const on = eff.yKeys.includes(k);
                    return (
                      <button key={k} type="button" onClick={() => toggleY(k)} aria-pressed={on} className={cn("rounded-full border px-3 py-1 text-[12.5px] transition-colors", on ? "border-[rgba(196,178,141,0.5)] bg-[rgba(196,178,141,0.16)] text-sand-50" : "border-line bg-white/[0.03] text-sand-100/75 hover:bg-white/[0.06]")}>
                        {k}
                      </button>
                    );
                  })}
                  {fields.numeric.length === 0 && <span className="text-[12.5px] text-ink-muted">Bu kaynakta sayısal alan yok.</span>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Toplama</Label>
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-white/[0.03] p-1">
                  {AGGS.map((a) => (
                    <button key={a.id} type="button" onClick={() => set({ agg: a.id })} className={cn("rounded-lg py-1.5 text-[12.5px] transition-colors", cfg.agg === a.id ? "bg-[rgba(196,178,141,0.16)] text-sand-50" : "text-sand-100/70 hover:bg-white/[0.05]")}>{a.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard hover={false} as="section">
            <SectionHeader title="Görünüm" subtitle="Grafik türü ve stil" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5">
                {CHART_TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => set({ chartType: t.id })} aria-pressed={cfg.chartType === t.id} className={cn("rounded-xl border px-3 py-2 text-left text-[13px] transition-all", cfg.chartType === t.id ? "border-[rgba(196,178,141,0.45)] bg-[rgba(196,178,141,0.14)] text-sand-50 shadow-[inset_0_0_18px_rgba(196,178,141,0.06)]" : "border-line bg-white/[0.02] text-sand-100/80 hover:-translate-y-px hover:border-line-strong hover:bg-white/[0.05]")}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Renk paleti başlangıcı</Label>
                <div className="flex gap-2">
                  {SERIES.map((c, i) => (
                    <button key={c} type="button" onClick={() => set({ paletteStart: i })} aria-label={PALETTE_NAMES[i]} aria-pressed={cfg.paletteStart === i} className={cn("h-7 w-7 rounded-full border-2 transition-transform hover:scale-105", cfg.paletteStart === i ? "border-sand-50" : "border-transparent")} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                {([["grid", "Kılavuz çizgileri"], ["legend", "Lejant"], ["labels", "Değer etiketleri"], ["smooth", "Yumuşak eğri"]] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center justify-between gap-3 text-sand-100/85">
                    {label}
                    <Switch size="sm" checked={cfg[k]} onCheckedChange={(v) => set({ [k]: Boolean(v) } as Partial<StudioConfig>)} className="data-checked:bg-sand-300" />
                  </label>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard hover={false} className="max-lg:order-first lg:col-span-8" as="section">
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="st-title">Başlık</Label>
              <Input id="st-title" value={eff.title} onChange={(e) => { setTitleAuto(false); set({ title: e.target.value, subtitle: eff.subtitle }); }} className="rounded-xl border-line bg-white/[0.04] font-serif text-[16px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-sub">Alt başlık</Label>
              <Input id="st-sub" value={eff.subtitle} onChange={(e) => { setTitleAuto(false); set({ subtitle: e.target.value, title: eff.title }); }} className="rounded-xl border-line bg-white/[0.04]" />
            </div>
          </div>
          <div ref={previewRef} className="rounded-2xl border border-line bg-navy-900/40 p-5">
            <div className="mb-4">
              <h2 className="font-serif text-[20px] font-medium text-sand-50">{eff.title || "Başlıksız grafik"}</h2>
              {eff.subtitle && <p className="mt-0.5 text-[12.5px] text-ink-muted">{eff.subtitle}</p>}
            </div>
            {loading && !rows.length ? <CardSkeleton className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none" lines={8} /> : <StudioChart config={eff} rows={rows} height={380} />}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-muted">
            <span className="tnum">{rows.length} satır · {eff.yKeys.length} seri · {AGGS.find((a) => a.id === eff.agg)?.label}</span>
            <Link href="/kisisel" className="text-sand-200 hover:text-sand-50">Kaydedilen widget&apos;lar Kişisel Dashboard&apos;da →</Link>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
