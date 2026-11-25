"use client";

import { useMemo, useRef, useState } from "react";
import { Database, FileSpreadsheet, Plus, RefreshCw, Search, Trash2, Unplug, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, IS_DEMO } from "@/lib/api";
import { datasourcesMock } from "@/lib/mock";
import { tryApi, useApi } from "@/lib/use-api";
import type { DataSource, UploadResult } from "@/lib/types";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { DataTable, MatrixTable } from "@/components/vespera/data-table";
import { ExportButton } from "@/components/vespera/export-button";
import { exportTable } from "@/lib/export";
import { GlassButton, IconButton, PrimaryButton } from "@/components/vespera/buttons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/components/vespera/section-header";
import { StatusBadge } from "@/components/vespera/status-badge";
import { cn } from "@/lib/utils";

const TYPES = ["Veritabanı", "Excel Dosyası", "CSV Dosyası", "API / Web Servisi"] as const;
type SourceType = (typeof TYPES)[number];
const isFile = (t: SourceType) => t === "Excel Dosyası" || t === "CSV Dosyası";

export function DataSourcesView() {
  const { data, setData } = useApi(api.datasources, datasourcesMock);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<SourceType>("CSV Dosyası");
  const [connection, setConnection] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<UploadResult | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((d) => !s || d.name.toLowerCase().includes(s) || d.type.toLowerCase().includes(s) || d.connection.toLowerCase().includes(s));
  }, [data, q]);

  function openNew() { setName(""); setType("CSV Dosyası"); setConnection(""); setFile(null); setOpen(true); }

  async function submit() {
    if (!name.trim()) { toast.warning("Kaynak adı gerekli"); return; }
    setBusy(true);
    try {
      if (isFile(type)) {
        if (!file) { toast.warning("Bir dosya seçin"); return; }
        if (IS_DEMO) { toast("Demo modunda dosya yükleme kapalı", { description: "Canlı kurulumda dosyalar sunucuda ayrıştırılır ve asistana bağlanır." }); return; }
        const res = await api.upload(file, name.trim());
        setPreview(res);
        const ds: DataSource = {
          id: res.id, name: res.name || name.trim(), type, connection: file.name, recordCount: res.rows.toLocaleString("tr-TR"),
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, updatedAt: "az önce", status: "Bağlı", columns: res.columns, preview: res.preview,
        };
        setData((p) => [...(p ?? []).filter((x) => x.id !== ds.id), ds]);
        toast.success("Dosya yüklendi ve ayrıştırıldı", { description: `${res.rows.toLocaleString("tr-TR")} satır, ${res.columns.length} sütun` });
      } else {
        const body: Partial<DataSource> = { name: name.trim(), type, connection: connection.trim(), recordCount: "—", size: "N/A", updatedAt: "az önce", status: "Bağlı" };
        const { result } = await tryApi(() => api.datasourceCreate(body), () => ({ id: `local-${Date.now()}`, ...body } as DataSource));
        setData((p) => [...(p ?? []), { ...(body as DataSource), ...result }]);
        toast.success("Veri kaynağı eklendi", { description: name.trim() });
      }
      setOpen(false);
      setTab("all");
    } catch {
      toast.error("İşlem başarısız", { description: "Dosya yükleme için backend'in çalışması gerekir." });
    } finally {
      setBusy(false);
    }
  }

  async function sync(d: DataSource) {
    setSyncing(d.id);
    const { result, source } = await tryApi(() => api.datasourceSync(d.id), () => ({ ...d, updatedAt: "az önce", status: "Bağlı" as const }));
    setData((p) => (p ?? []).map((x) => (x.id === d.id ? { ...x, ...result } : x)));
    setSyncing(null);
    toast.success("Senkronize edildi", { description: source === "api" ? d.name : `${d.name} (yerel)` });
  }
  async function disconnect(d: DataSource) {
    setData((p) => (p ?? []).map((x) => (x.id === d.id ? { ...x, status: "Bağlantı Yok" } : x)));
    toast("Bağlantı kesildi", { description: d.name });
  }
  async function remove(d: DataSource) {
    setData((p) => (p ?? []).filter((x) => x.id !== d.id));
    await tryApi(() => api.datasourceDelete(d.id), () => undefined);
    if (preview?.id === d.id) setPreview(null);
    toast("Veri kaynağı silindi", { description: d.name });
  }

  return (
    <Tabs value={tab} onValueChange={(v) => { setTab(String(v)); if (v === "new") openNew(); }}>
      <PageHeader
        icon={Database}
        title="Veri Kaynakları"
        subtitle="Veritabanı, dosya ve API bağlantılarını yönetin; yüklenen CSV/Excel dosyaları asistan tarafından kullanılır."
        actions={
          <TabsList className="h-10 rounded-xl border border-line bg-white/[0.04] p-1">
            <TabsTrigger value="all" className="rounded-lg px-4 text-[13px] data-active:bg-[rgba(196,178,141,0.16)]">Tüm Kaynaklar</TabsTrigger>
            <TabsTrigger value="new" className="rounded-lg px-4 text-[13px] data-active:bg-[rgba(196,178,141,0.16)]">Yeni Kaynak Ekle</TabsTrigger>
          </TabsList>
        }
      />

      <TabsContent value="all" className="vs-fade-slide space-y-6">
        <GlassCard hover={false} as="section">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-200/70" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kaynak ara..." aria-label="Kaynak ara" className="h-9 rounded-xl border-line bg-white/[0.04] pl-9 text-[13px]" />
            </div>
            <div className="flex items-center gap-2">
              <ExportButton onExport={() => exportTable("veri-kaynaklari", ["Veri Kaynağı", "Tür", "Bağlantı", "Kayıt Sayısı", "Boyut", "Güncelleme", "Durum"], rows.map((d) => [d.name, d.type, d.connection, d.recordCount, d.size, d.updatedAt, d.status]))} />
              <PrimaryButton onClick={openNew}><Plus size={15} strokeWidth={2} /> Yeni Kaynak</PrimaryButton>
            </div>
          </div>
          <DataTable<DataSource>
            mobile={{ title: "name", badge: "status", actions: "actions", wide: ["connection"] }}
            rows={rows}
            rowKey={(d) => d.id}
            columns={[
              {
                key: "name", header: "Veri Kaynağı",
                render: (d) => (
                  <span className="flex items-center gap-2.5 font-medium text-sand-50">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-sand-300">
                      {/dosya|excel|csv/i.test(d.type) ? <FileSpreadsheet size={15} strokeWidth={1.5} /> : <Database size={15} strokeWidth={1.5} />}
                    </span>
                    {d.name}
                  </span>
                ),
              },
              { key: "type", header: "Tür", render: (d) => <span className="text-sand-100/85">{d.type}</span> },
              { key: "connection", header: "Bağlantı", render: (d) => <code className="rounded-md bg-navy-900/60 px-1.5 py-0.5 font-mono text-[11.5px] text-sand-200/85">{d.connection}</code> },
              { key: "recordCount", header: "Kayıt Sayısı", align: "right", render: (d) => <span className="tnum">{d.recordCount}</span> },
              { key: "size", header: "Boyut", align: "right", render: (d) => <span className="tnum">{d.size}</span> },
              { key: "updatedAt", header: "Son Güncelleme", render: (d) => <span className="text-ink-muted">{d.updatedAt}</span> },
              { key: "status", header: "Durum", render: (d) => <StatusBadge status={d.status} /> },
              {
                key: "actions", header: "İşlemler", align: "right",
                render: (d) => (
                  <span className="inline-flex gap-0.5">
                    <IconButton aria-label="Senkronize et" onClick={() => void sync(d)} disabled={syncing === d.id}><RefreshCw size={14} className={cn(syncing === d.id && "animate-spin")} /></IconButton>
                    <IconButton aria-label="Bağlantıyı kes" onClick={() => void disconnect(d)}><Unplug size={14} /></IconButton>
                    <IconButton aria-label="Sil" onClick={() => void remove(d)} className="hover:text-err"><Trash2 size={14} /></IconButton>
                  </span>
                ),
              },
            ]}
          />
        </GlassCard>

        {preview && (
          <GlassCard hover={false} as="section">
            <SectionHeader title={`Önizleme: ${preview.name}`} subtitle={`${preview.rows.toLocaleString("tr-TR")} satır · ${preview.columns.length} sütun · ilk ${preview.preview.length} satır gösteriliyor`} />
            <MatrixTable dense columns={preview.columns} rows={preview.preview} maxHeight={360} />
          </GlassCard>
        )}
      </TabsContent>

      <TabsContent value="new" className="vs-fade-slide">
        <GlassCard hover={false} as="section">
          <SectionHeader title="Yeni Kaynak Ekle" subtitle="Form bir pencerede açılır; kapattıysanız aşağıdan yeniden açın." />
          <PrimaryButton onClick={openNew}><Plus size={15} strokeWidth={2} /> Formu Aç</PrimaryButton>
        </GlassCard>
      </TabsContent>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && tab === "new") setTab("all"); }}>
        <DialogContent className="glass-strong rounded-2xl border-line sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-[20px] font-medium">Yeni Veri Kaynağı</DialogTitle>
            <DialogDescription>Tür seçin; dosya türlerinde gerçek yükleme yapılır ve içerik ayrıştırılır.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ds-name">Kaynak Adı</Label>
              <Input id="ds-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. İK Verisi 2024" className="rounded-xl border-line bg-navy-900/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select value={type} onValueChange={(v) => setType(v as SourceType)}>
                <SelectTrigger className="w-full rounded-xl border-line bg-navy-900/50"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong rounded-xl border-line">{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {isFile(type) ? (
              <div className="space-y-1.5">
                <Label>Dosya</Label>
                <input ref={fileRef} type="file" accept={type === "CSV Dosyası" ? ".csv" : ".xlsx,.xls"} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white/[0.02] px-4 py-8 text-[13px] text-sand-100/80 transition-colors hover:border-line-strong hover:bg-white/[0.04]"
                >
                  <Upload size={18} strokeWidth={1.5} className="text-sand-300" />
                  {file ? <span className="text-sand-50">{file.name} <span className="tnum text-ink-muted">({(file.size / 1024).toFixed(0)} KB)</span></span> : <span>Dosya seçmek için tıklayın ({type === "CSV Dosyası" ? ".csv" : ".xlsx / .xls"})</span>}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="ds-conn">{type === "Veritabanı" ? "Bağlantı Dizesi" : "Uç Nokta URL"}</Label>
                <Input id="ds-conn" value={connection} onChange={(e) => setConnection(e.target.value)} placeholder={type === "Veritabanı" ? "postgresql://user:pass@host/db" : "https://api.example.com/v1/data"} className="rounded-xl border-line bg-navy-900/50 font-mono text-[12.5px]" />
              </div>
            )}
          </div>
          <DialogFooter>
            <GlassButton onClick={() => setOpen(false)}>Vazgeç</GlassButton>
            <PrimaryButton onClick={() => void submit()} disabled={busy}>{busy ? "Yükleniyor…" : isFile(type) ? "Yükle ve Ekle" : "Ekle"}</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
