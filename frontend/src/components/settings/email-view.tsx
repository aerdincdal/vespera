"use client";

import { useMemo, useState } from "react";
import { Mail, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { emailsMock, RECIPIENT_GROUPS, REPORT_OPTIONS, SCHEDULE_OPTIONS } from "@/lib/mock";
import { tryApi, useApi } from "@/lib/use-api";
import type { ScheduledEmail } from "@/lib/types";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { DataTable } from "@/components/vespera/data-table";
import { ExportButton } from "@/components/vespera/export-button";
import { exportTable } from "@/lib/export";
import { GlassButton, IconButton, PrimaryButton } from "@/components/vespera/buttons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/components/vespera/section-header";
import { cn } from "@/lib/utils";

function Chips({ items, tone = "sand" }: { items: string[]; tone?: "sand" | "steel" }) {
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((it) => (
        <span key={it} className={cn("rounded-full border px-2 py-0.5 text-[11px]", tone === "sand" ? "border-line bg-[rgba(196,178,141,0.08)] text-sand-100" : "border-[rgba(127,159,207,0.3)] bg-[rgba(127,159,207,0.08)] text-sand-100")}>
          {it}
        </span>
      ))}
    </span>
  );
}

const EMPTY: Omit<ScheduledEmail, "id"> = { subject: "", recipients: [], reports: [], schedule: SCHEDULE_OPTIONS[1], lastSent: "—", status: "Aktif" };

export function EmailView() {
  const { data, setData } = useApi(api.emails, emailsMock);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("list");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledEmail | null>(null);
  const [form, setForm] = useState<Omit<ScheduledEmail, "id">>(EMPTY);
  const [sending, setSending] = useState<string | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((e) => !s || e.subject.toLowerCase().includes(s) || e.recipients.join(" ").toLowerCase().includes(s));
  }, [data, q]);

  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(e: ScheduledEmail) { setEditing(e); setForm({ ...e }); setOpen(true); }

  async function submit(sendNow = false) {
    if (!form.subject.trim() || form.recipients.length === 0) {
      toast.warning("Konu ve en az bir alıcı gerekli");
      return;
    }
    let saved: ScheduledEmail;
    if (editing) {
      const { result } = await tryApi(() => api.emailPatch(editing.id, form), () => ({ ...editing, ...form }));
      saved = { ...editing, ...result };
      setData((p) => (p ?? []).map((e) => (e.id === editing.id ? saved : e)));
    } else {
      const local: ScheduledEmail = { id: `local-${Date.now()}`, ...form };
      const { result } = await tryApi(() => api.emailCreate(form), () => local);
      saved = { ...local, ...result };
      setData((p) => [...(p ?? []), saved]);
    }
    setOpen(false);
    setTab("list");
    toast.success(editing ? "E-posta güncellendi" : "Zamanlanmış e-posta oluşturuldu", { description: saved.subject });
    if (sendNow) await send(saved);
  }

  async function send(e: ScheduledEmail) {
    setSending(e.id);
    try {
      const res = await api.emailSend(e.id);
      if (res.simulated) toast.info("Gönderim simüle edildi", { description: `${e.subject} — SMTP yapılandırılmadığı için e-posta loglandı.` });
      else toast.success("E-posta gönderildi", { description: e.subject });
      const today = new Date().toISOString().slice(0, 10);
      setData((p) => (p ?? []).map((x) => (x.id === e.id ? { ...x, lastSent: today } : x)));
    } catch {
      toast.error("Gönderilemedi", { description: "Backend erişilemedi." });
    } finally {
      setSending(null);
    }
  }

  async function remove(e: ScheduledEmail) {
    setData((p) => (p ?? []).filter((x) => x.id !== e.id));
    await tryApi(() => api.emailDelete(e.id), () => undefined);
    toast("Zamanlama silindi", { description: e.subject });
  }

  return (
    <Tabs value={tab} onValueChange={(v) => { setTab(String(v)); if (v === "new") openNew(); }}>
      <PageHeader
        icon={Mail}
        title="E-posta Gönderimi"
        subtitle="Raporların hangi ekiplere, hangi takvimle gönderileceğini yönetin."
        actions={
          <TabsList className="h-10 rounded-xl border border-line bg-white/[0.04] p-1">
            <TabsTrigger value="list" className="rounded-lg px-4 text-[13px] data-active:bg-[rgba(196,178,141,0.16)]">Zamanlanmış E-postalar</TabsTrigger>
            <TabsTrigger value="new" className="rounded-lg px-4 text-[13px] data-active:bg-[rgba(196,178,141,0.16)]">Yeni E-posta</TabsTrigger>
          </TabsList>
        }
      />

      <TabsContent value="list" className="vs-fade-slide">
        <GlassCard hover={false} as="section">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-200/70" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="E-posta ara..." aria-label="E-posta ara" className="h-9 rounded-xl border-line bg-white/[0.04] pl-9 text-[13px]" />
            </div>
            <div className="flex items-center gap-2">
              <ExportButton onExport={() => exportTable("zamanlanmis-epostalar", ["Başlık", "Alıcılar", "Raporlar", "Zamanlama", "Son Gönderim", "Durum"], rows.map((e) => [e.subject, e.recipients.join(", "), e.reports.join(", "), e.schedule, e.lastSent, e.status]))} />
              <PrimaryButton onClick={openNew}><Plus size={15} strokeWidth={2} /> Yeni E-posta</PrimaryButton>
            </div>
          </div>
          <DataTable<ScheduledEmail>
            mobile={{ title: "subject", badge: "status", actions: "actions", wide: ["recipients", "reports"] }}
            rows={rows}
            rowKey={(e) => e.id}
            columns={[
              { key: "subject", header: "E-posta Başlığı", render: (e) => <span className="font-medium text-sand-50">{e.subject}</span> },
              { key: "recipients", header: "Alıcılar", render: (e) => <Chips items={e.recipients} /> },
              { key: "reports", header: "Raporlar", render: (e) => <Chips items={e.reports} tone="steel" /> },
              { key: "schedule", header: "Zamanlama", render: (e) => <span className="text-sand-100/85">{e.schedule}</span> },
              { key: "lastSent", header: "Son Gönderim" },
              { key: "status", header: "Durum" },
              {
                key: "actions", header: "İşlemler", align: "right",
                render: (e) => (
                  <span className="inline-flex gap-0.5">
                    <IconButton aria-label="Şimdi gönder" onClick={() => void send(e)} disabled={sending === e.id} className={cn(sending === e.id && "animate-pulse")}><Send size={14} /></IconButton>
                    <IconButton aria-label="Düzenle" onClick={() => openEdit(e)}><Pencil size={14} /></IconButton>
                    <IconButton aria-label="Sil" onClick={() => void remove(e)} className="hover:text-err"><Trash2 size={14} /></IconButton>
                  </span>
                ),
              },
            ]}
          />
        </GlassCard>
      </TabsContent>

      <TabsContent value="new" className="vs-fade-slide">
        <GlassCard hover={false} as="section">
          <SectionHeader title="Yeni E-posta" subtitle="Form bir pencerede açılır; kapattıysanız aşağıdan yeniden açın." />
          <PrimaryButton onClick={openNew}><Plus size={15} strokeWidth={2} /> Formu Aç</PrimaryButton>
        </GlassCard>
      </TabsContent>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && tab === "new") setTab("list"); }}>
        <DialogContent className="glass-strong rounded-2xl border-line sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-[20px] font-medium">{editing ? "E-postayı Düzenle" : "Yeni E-posta"}</DialogTitle>
            <DialogDescription>Alıcı gruplarını ve raporları seçin, gönderim takvimini belirleyin.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="e-subject">Konu</Label>
              <Input id="e-subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="rounded-xl border-line bg-navy-900/50" placeholder="Örn. Haftalık Satış Raporu" />
            </div>
            <div className="space-y-1.5">
              <Label>Alıcılar</Label>
              <div className="flex flex-wrap gap-1.5">
                {RECIPIENT_GROUPS.map((g) => (
                  <button key={g} type="button" aria-pressed={form.recipients.includes(g)} onClick={() => setForm((f) => ({ ...f, recipients: toggleIn(f.recipients, g) }))}
                    className={cn("rounded-full border px-3 py-1 text-[12px] transition-colors", form.recipients.includes(g) ? "border-sand-300/50 bg-[rgba(196,178,141,0.16)] text-sand-50" : "border-line text-sand-100/75 hover:bg-white/[0.05]")}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Raporlar</Label>
              <div className="flex flex-wrap gap-1.5">
                {REPORT_OPTIONS.map((r) => (
                  <button key={r} type="button" aria-pressed={form.reports.includes(r)} onClick={() => setForm((f) => ({ ...f, reports: toggleIn(f.reports, r) }))}
                    className={cn("rounded-full border px-3 py-1 text-[12px] transition-colors", form.reports.includes(r) ? "border-[rgba(127,159,207,0.5)] bg-[rgba(127,159,207,0.14)] text-sand-50" : "border-line text-sand-100/75 hover:bg-white/[0.05]")}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Zamanlama</Label>
                <Select value={form.schedule} onValueChange={(v) => setForm((f) => ({ ...f, schedule: String(v) }))}>
                  <SelectTrigger className="w-full rounded-xl border-line bg-navy-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl border-line">{SCHEDULE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ScheduledEmail["status"] }))}>
                  <SelectTrigger className="w-full rounded-xl border-line bg-navy-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl border-line"><SelectItem value="Aktif">Aktif</SelectItem><SelectItem value="Pasif">Pasif</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <GlassButton onClick={() => void submit(true)}><Send size={14} strokeWidth={1.75} /> Şimdi Gönder</GlassButton>
            <div className="flex gap-2">
              <GlassButton onClick={() => setOpen(false)}>Vazgeç</GlassButton>
              <PrimaryButton onClick={() => void submit(false)}>{editing ? "Güncelle" : "Kaydet"}</PrimaryButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
