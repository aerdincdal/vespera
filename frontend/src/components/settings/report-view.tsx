"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, Download, FileText, Heading, Image as ImageIcon, Save, Table as TableIcon, Trash2, Type } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useSyncExternalStore } from "react";
import { Printer } from "lucide-react";
import { IS_DEMO } from "@/lib/api";
import { moduleLabel } from "@/lib/nav";
import { Monogram } from "@/components/shell/logo";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { REPORT_CHART_SOURCES, REPORT_TABLE_SOURCES, reportChartData, reportTableData, reportsMock } from "@/lib/mock";
import { tryApi, useApi } from "@/lib/use-api";
import type { Report, ReportComponent, ReportComponentType } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { GlassButton, IconButton, PrimaryButton } from "@/components/vespera/buttons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatrixTable, DataTable } from "@/components/vespera/data-table";
import { BarChart } from "@/components/charts/bar-chart";
import { EmptyState } from "@/components/vespera/empty-state";
import { cn } from "@/lib/utils";

const COMPONENT_TYPES: Array<{ type: ReportComponentType; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { type: "title", label: "Başlık", icon: Heading },
  { type: "text", label: "Metin", icon: Type },
  { type: "table", label: "Tablo", icon: TableIcon },
  { type: "chart", label: "Grafik", icon: BarChart3 },
  { type: "image", label: "Görsel", icon: ImageIcon },
];
const TYPE_ICON = Object.fromEntries(COMPONENT_TYPES.map((c) => [c.type, c.icon])) as Record<ReportComponentType, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>>;
const REPORT_TYPES = ["Özet Rapor", "Detaylı Rapor", "Yönetim Raporu", "Operasyon Raporu"];
const uid = () => Math.random().toString(36).slice(2, 9);

export function ReportView() {
  const { data: reports, setData: setReports } = useApi(api.reports, reportsMock);
  const [draft, setDraft] = useState<Report | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdf, setPdf] = useState(false);
  const [tab, setTab] = useState("new");
  const [printOpen, setPrintOpen] = useState(false);

  // Opened from a module drawer ("Rapor oluştur"): ?from=<slug> pre-fills a report for that module.
  // Read via useSyncExternalStore so the server render (no query string) and the client agree.
  const from = useSyncExternalStore(() => () => {}, () => new URLSearchParams(window.location.search).get("from"), () => null);
  const prefilled = useMemo<Report | null>(() => {
    if (!from) return null;
    const label = moduleLabel(from);
    return {
      ...reportsMock[0],
      id: `local-${from}`,
      name: `${label} Raporu`,
      reportType: "Yönetim Raporu",
      description: `${label} modülünden ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihinde oluşturulan özet rapor.`,
      components: [
        { id: `${from}-t`, type: "title", label: "Başlık", content: `${label} – Aylık Özet` },
        { id: `${from}-x`, type: "text", label: "Yönetici Özeti", content: `${label} göstergeleri hedeflerle karşılaştırılmış, sapmalar ve öneriler aşağıda özetlenmiştir.` },
        { id: `${from}-c`, type: "chart", label: "Eğilim Grafiği", source: REPORT_CHART_SOURCES[0] },
        { id: `${from}-b`, type: "table", label: "Özet Tablo", source: REPORT_TABLE_SOURCES[0] },
      ],
    };
  }, [from]);

  // Until the user edits, the builder is seeded from the first saved report (API or mock) with an empty name.
  const report: Report = draft ?? prefilled ?? { ...(reports?.[0] ?? reportsMock[0]), name: "" };
  const setReport = (r: Report) => setDraft(r);
  const update = (patch: Partial<Report>) => setDraft({ ...report, ...patch });
  const updateComp = (id: string, patch: Partial<ReportComponent>) =>
    update({ components: report.components.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= report.components.length) return;
    const next = [...report.components];
    [next[i], next[j]] = [next[j], next[i]];
    update({ components: next });
  };
  const addComp = (type: ReportComponentType) => {
    const label = COMPONENT_TYPES.find((c) => c.type === type)?.label ?? type;
    const comp: ReportComponent = {
      id: uid(), type, label: `Yeni ${label}`,
      content: type === "title" ? "Yeni başlık" : type === "text" ? "" : undefined,
      source: type === "chart" ? REPORT_CHART_SOURCES[0] : type === "table" ? REPORT_TABLE_SOURCES[0] : undefined,
    };
    update({ components: [...report.components, comp] });
  };

  async function save() {
    if (!report.name.trim()) {
      toast.warning("Rapor adı gerekli");
      return;
    }
    setSaving(true);
    const isLocal = report.id.startsWith("local-") || !reports?.some((r) => r.id === report.id);
    const { result, source } = await tryApi(
      () => (isLocal ? api.reportCreate({ ...report, id: undefined } as unknown as Omit<Report, "id">) : api.reportPut(report.id, report)),
      () => ({ ...report, id: isLocal ? `local-${uid()}` : report.id, updatedAt: new Date().toISOString().slice(0, 10) }),
    );
    setReport(result);
    setReports((p) => {
      const list = p ?? [];
      return list.some((r) => r.id === result.id) ? list.map((r) => (r.id === result.id ? result : r)) : [...list, result];
    });
    setSaving(false);
    toast.success("Rapor kaydedildi", { description: source === "api" ? report.name : `${report.name} (yerel)` });
  }

  async function downloadPdf() {
    if (IS_DEMO) {
      setPrintOpen(true);
      return;
    }
    setPdf(true);
    try {
      const blob = await api.reportPdf(report.id, report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(report.name || "rapor").replace(/[^\w\-]+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF indirildi");
    } catch {
      // No backend: fall back to the browser's own PDF engine via a print-styled preview.
      setPrintOpen(true);
    } finally {
      setPdf(false);
    }
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
      <PageHeader
        icon={FileText}
        title="Rapor Oluşturma"
        subtitle="Bileşenleri ekleyip sıralayın, içeriği düzenleyin ve PDF olarak dışa aktarın."
        actions={
          <TabsList className="h-10 rounded-xl border border-line bg-white/[0.04] p-1">
            <TabsTrigger value="new" className="rounded-lg px-4 text-[13px] data-active:bg-[rgba(196,178,141,0.16)]">Yeni Rapor</TabsTrigger>
            <TabsTrigger value="mine" className="rounded-lg px-4 text-[13px] data-active:bg-[rgba(196,178,141,0.16)]">Raporlarım</TabsTrigger>
          </TabsList>
        }
      />

      <TabsContent value="new" className="vs-fade-slide">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <GlassCard hover={false} as="section">
              <SectionHeader title="Rapor Bilgileri" />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="r-name">Rapor Adı <span className="text-err">*</span></Label>
                  <Input id="r-name" value={report.name} onChange={(e) => update({ name: e.target.value })} placeholder="Rapor adını girin" className="rounded-xl border-line bg-white/[0.04]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Rapor Türü</Label>
                  <Select value={report.reportType} onValueChange={(v) => update({ reportType: String(v) })}>
                    <SelectTrigger className="w-full rounded-xl border-line bg-white/[0.04]"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-strong rounded-xl border-line">{REPORT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-desc">Açıklama</Label>
                  <Textarea id="r-desc" rows={4} value={report.description} onChange={(e) => update({ description: e.target.value })} placeholder="Rapor açıklaması girin" className="rounded-xl border-line bg-white/[0.04]" />
                </div>
              </div>
            </GlassCard>

            <GlassCard hover={false} as="section">
              <SectionHeader title="Bileşen Ekle" subtitle="Tıkladığınız bileşen listenin sonuna eklenir" />
              <div className="grid grid-cols-3 gap-2">
                {COMPONENT_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addComp(type)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-2 py-4 text-[12.5px] text-sand-100 transition-all hover:-translate-y-px hover:border-line-strong hover:bg-white/[0.05]"
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard hover={false} className="lg:col-span-8" as="section">
            <SectionHeader
              title="Rapor İçeriği"
              subtitle={`${report.components.length} bileşen`}
              action={
                <div className="flex gap-2">
                  <GlassButton onClick={() => void save()} disabled={saving}><Save size={14} strokeWidth={1.75} /> {saving ? "Kaydediliyor…" : "Kaydet"}</GlassButton>
                  <PrimaryButton onClick={() => void downloadPdf()} disabled={pdf}><Download size={14} strokeWidth={1.75} /> {pdf ? "Hazırlanıyor…" : "PDF İndir"}</PrimaryButton>
                </div>
              }
            />
            {report.components.length === 0 ? (
              <EmptyState title="Henüz bileşen yok" description="Soldaki panelden bir bileşen ekleyerek başlayın." />
            ) : (
              <ol className="space-y-4">
                {report.components.map((c, i) => {
                  const Icon = TYPE_ICON[c.type];
                  return (
                    <li key={c.id} className="rounded-2xl border border-line bg-white/[0.02] p-4 vs-fade-slide">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2 text-[13.5px] font-semibold text-sand-50">
                          <Icon size={15} strokeWidth={1.5} className="text-sand-300" />
                          <input
                            value={c.label}
                            onChange={(e) => updateComp(c.id, { label: e.target.value })}
                            aria-label="Bileşen adı"
                            className="min-w-0 flex-1 bg-transparent focus:outline-none focus:ring-0 border-b border-transparent focus:border-line-strong"
                          />
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <IconButton aria-label="Yukarı taşı" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={14} /></IconButton>
                          <IconButton aria-label="Aşağı taşı" onClick={() => move(i, 1)} disabled={i === report.components.length - 1}><ArrowDown size={14} /></IconButton>
                          <IconButton aria-label="Sil" onClick={() => update({ components: report.components.filter((x) => x.id !== c.id) })} className="hover:text-err"><Trash2 size={14} /></IconButton>
                        </div>
                      </div>

                      {c.type === "title" && (
                        <Input value={c.content ?? ""} onChange={(e) => updateComp(c.id, { content: e.target.value })} aria-label="Başlık metni" className="rounded-xl border-line bg-navy-900/40 font-serif text-[16px]" />
                      )}
                      {c.type === "text" && (
                        <Textarea rows={4} value={c.content ?? ""} onChange={(e) => updateComp(c.id, { content: e.target.value })} aria-label="Metin" className="rounded-xl border-line bg-navy-900/40 text-[13.5px] leading-relaxed" />
                      )}
                      {(c.type === "chart" || c.type === "table") && (
                        <>
                          <Select value={c.source ?? ""} onValueChange={(v) => updateComp(c.id, { source: String(v) })}>
                            <SelectTrigger className="mb-3 w-full rounded-xl border-line bg-navy-900/40 sm:w-72" aria-label="Veri kaynağı"><SelectValue /></SelectTrigger>
                            <SelectContent className="glass-strong rounded-xl border-line">
                              {(c.type === "chart" ? REPORT_CHART_SOURCES : REPORT_TABLE_SOURCES).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <div className="rounded-xl border border-dashed border-line bg-navy-900/30 p-3">
                            {c.type === "chart" ? (
                              <BarChart data={reportChartData} xKey="ay" yKeys={["Satış"]} height={180} unit=" ₺M" />
                            ) : (
                              <MatrixTable dense columns={reportTableData.columns} rows={reportTableData.rows} />
                            )}
                          </div>
                        </>
                      )}
                      {c.type === "image" && (
                        <div className={cn("flex h-28 items-center justify-center rounded-xl border border-dashed border-line text-[12.5px] text-ink-muted")}>
                          <ImageIcon size={16} strokeWidth={1.5} className="mr-2" /> Görsel yer tutucu, PDF&apos;te logo alanı olarak kullanılır
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </GlassCard>
        </div>
      </TabsContent>

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto rounded-2xl border-line sm:max-w-3xl vs-print-dialog">
          <DialogHeader className="vs-no-print">
            <DialogTitle className="font-serif text-[20px] font-medium">PDF Önizleme</DialogTitle>
            <DialogDescription>Tarayıcının yazdırma penceresinden &quot;PDF olarak kaydet&quot; seçin. Canlı kurulumda PDF sunucuda üretilir ve e-posta ile dağıtılır.</DialogDescription>
          </DialogHeader>
          <article id="vs-print-area" className="vs-print-sheet rounded-xl bg-[#fbf8f1] p-8 text-[#132038]">
            <header className="flex items-start justify-between border-b border-[#132038]/15 pb-4">
              <div className="flex items-center gap-2.5 text-[#132038]">
                <Monogram size={28} />
                <div className="leading-none">
                  <div className="font-serif text-[16px] font-medium tracking-[0.12em]">VESPERA</div>
                  <div className="mt-1 text-[10px] text-[#132038]/60">Fabrika Zekâ Platformu</div>
                </div>
              </div>
              <div className="text-right text-[11px] leading-relaxed text-[#132038]/70">
                <div>{report.reportType}</div>
                <div>{new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</div>
                <div>App On Inc.</div>
              </div>
            </header>
            <h1 className="mt-6 font-serif text-[26px] font-medium leading-tight">{report.name || "Adsız rapor"}</h1>
            {report.description && <p className="mt-2 text-[13px] leading-relaxed text-[#132038]/75">{report.description}</p>}
            <div className="mt-6 space-y-6">
              {report.components.map((c) => (
                <section key={c.id}>
                  {c.type === "title" && <h2 className="font-serif text-[19px] font-medium">{c.content || c.label}</h2>}
                  {c.type === "text" && <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{c.content || "—"}</p>}
                  {c.type === "chart" && (
                    <div>
                      <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-[#132038]/60">{c.label} · {c.source}</div>
                      <table className="w-full border-collapse text-[12.5px]">
                        <thead><tr>{reportChartData.map((d) => <th key={String(d.ay)} className="border-b border-[#132038]/20 py-1 text-center font-medium">{d.ay}</th>)}</tr></thead>
                        <tbody><tr>{reportChartData.map((d) => <td key={String(d.ay)} className="tnum py-1 text-center">{d["Satış"]}</td>)}</tr></tbody>
                      </table>
                      <div className="mt-2 flex h-24 items-end gap-1.5">
                        {reportChartData.map((d) => <span key={String(d.ay)} className="flex-1 rounded-t bg-[#8b7a55]" style={{ height: `${(Number(d["Satış"]) / Math.max(...reportChartData.map((x) => Number(x["Satış"])))) * 100}%` }} />)}
                      </div>
                    </div>
                  )}
                  {c.type === "table" && (
                    <div>
                      <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-[#132038]/60">{c.label} · {c.source}</div>
                      <table className="w-full border-collapse text-[12.5px]">
                        <thead><tr>{reportTableData.columns.map((col) => <th key={col} className="border-b border-[#132038]/25 py-1.5 text-left font-medium">{col}</th>)}</tr></thead>
                        <tbody>{reportTableData.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="tnum border-b border-[#132038]/10 py-1.5">{v}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                  {c.type === "image" && <div className="flex h-20 items-center justify-center rounded border border-dashed border-[#132038]/30 text-[12px] text-[#132038]/60">Logo / görsel alanı</div>}
                </section>
              ))}
            </div>
            <footer className="mt-8 border-t border-[#132038]/15 pt-3 text-[10.5px] text-[#132038]/60">VESPERA Fabrika Zekâ Platformu · © 2026 App On Inc. · Bu rapor demo verisiyle üretilmiştir.</footer>
          </article>
          <DialogFooter className="vs-no-print">
            <GlassButton onClick={() => setPrintOpen(false)}>Kapat</GlassButton>
            <PrimaryButton onClick={() => window.print()}><Printer size={14} strokeWidth={1.75} /> Yazdır / PDF olarak kaydet</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TabsContent value="mine" className="vs-fade-slide">
        <GlassCard hover={false} as="section">
          <SectionHeader title="Raporlarım" subtitle="Kaydedilmiş raporlar" />
          <DataTable<Report>
            mobile={{ title: "name", actions: "actions" }}
            rows={reports ?? []}
            rowKey={(r) => r.id}
            emptyText="Kaydedilmiş rapor yok."
            columns={[
              { key: "name", header: "Rapor", render: (r) => <span className="font-medium text-sand-50">{r.name || "Adsız rapor"}</span> },
              { key: "reportType", header: "Tür" },
              { key: "components", header: "Bileşen", align: "right", render: (r) => <span className="tnum">{r.components.length}</span> },
              { key: "updatedAt", header: "Güncelleme", render: (r) => <span className="tnum text-ink-muted">{r.updatedAt ? fmtDate(r.updatedAt) : "—"}</span> },
              {
                key: "actions", header: "İşlemler", align: "right",
                render: (r) => (
                  <span className="inline-flex gap-1">
                    <GlassButton className="h-8 px-3 text-[12px]" onClick={() => { setReport(r); setTab("new"); }}>Aç</GlassButton>
                    <IconButton aria-label="Sil" className="hover:text-err" onClick={async () => { setReports((p) => (p ?? []).filter((x) => x.id !== r.id)); await tryApi(() => api.reportDelete(r.id), () => undefined); toast("Rapor silindi"); }}><Trash2 size={14} /></IconButton>
                  </span>
                ),
              },
            ]}
          />
        </GlassCard>
      </TabsContent>
    </Tabs>
  );
}
