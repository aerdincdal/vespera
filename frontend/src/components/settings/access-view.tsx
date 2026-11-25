"use client";

import { useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PERMISSION_MODULES, rolesMock, usersMock } from "@/lib/mock";
import { tryApi, useApi } from "@/lib/use-api";
import type { Role, User } from "@/lib/types";
import { initials } from "@/lib/format";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { DataTable } from "@/components/vespera/data-table";
import { StatusBadge } from "@/components/vespera/status-badge";
import { GlassButton, IconButton, PrimaryButton } from "@/components/vespera/buttons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/components/vespera/section-header";
import { ExportButton } from "@/components/vespera/export-button";
import { exportTable } from "@/lib/export";

const ROLES: User["role"][] = ["Admin", "Yönetici", "Analist", "Gözlemci"];

export function AccessView() {
  const { data: users, setData: setUsers } = useApi(api.users, usersMock);
  const { data: roles, setData: setRoles } = useApi(api.roles, rolesMock);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, "id">>({ name: "", email: "", role: "Analist", status: "Aktif", lastLogin: "—" });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (users ?? []).filter((u) => !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.role.toLowerCase().includes(s));
  }, [users, q]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", email: "", role: "Analist", status: "Aktif", lastLogin: "—" });
    setOpen(true);
  }
  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status, lastLogin: u.lastLogin });
    setOpen(true);
  }
  async function submit() {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editing) {
      const { result } = await tryApi(() => api.userPatch(editing.id, form), () => ({ ...editing, ...form }));
      setUsers((p) => (p ?? []).map((u) => (u.id === editing.id ? { ...u, ...result } : u)));
      toast.success("Kullanıcı güncellendi", { description: form.name });
    } else {
      const local: User = { id: `local-${Date.now()}`, ...form, lastLogin: "Henüz giriş yapmadı" };
      const { result } = await tryApi(() => api.userAdd(form), () => local);
      setUsers((p) => [...(p ?? []), { ...local, ...result }]);
      toast.success("Kullanıcı eklendi", { description: form.name });
    }
    setOpen(false);
  }
  async function remove(u: User) {
    setUsers((p) => (p ?? []).filter((x) => x.id !== u.id));
    await tryApi(() => api.userDelete(u.id), () => undefined);
    toast("Kullanıcı silindi", { description: u.name });
  }
  function togglePerm(role: Role, mod: string, v: boolean) {
    setRoles((p) => (p ?? []).map((r) => (r.name === role.name ? { ...r, permissions: { ...r.permissions, [mod]: v } } : r)));
  }

  const [tab, setTab] = useState("users");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
      <PageHeader
        icon={KeyRound}
        title="Yetki Yönetimi"
        subtitle="Kullanıcıları yönetin ve rollerin hangi modüllere erişebileceğini belirleyin."
        actions={
          <TabsList className="h-10 rounded-xl border border-line bg-white/[0.04] p-1">
            <TabsTrigger value="users" className="rounded-lg px-4 text-[13px] data-active:bg-[rgba(196,178,141,0.16)]">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="roles" className="rounded-lg px-4 text-[13px] data-active:bg-[rgba(196,178,141,0.16)]">Roller</TabsTrigger>
          </TabsList>
        }
      />

      <TabsContent value="users" className="vs-fade-slide">
        <GlassCard hover={false} as="section">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sand-200/70" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kullanıcı ara..." aria-label="Kullanıcı ara" className="h-9 rounded-xl border-line bg-white/[0.04] pl-9 text-[13px]" />
            </div>
            <div className="flex items-center gap-2">
              <ExportButton onExport={() => exportTable("kullanicilar", ["Ad Soyad", "E-posta", "Rol", "Durum", "Son Giriş"], filtered.map((u) => [u.name, u.email, u.role, u.status, u.lastLogin]))} />
              <PrimaryButton onClick={openNew}><Plus size={15} strokeWidth={2} /> Kullanıcı Ekle</PrimaryButton>
            </div>
          </div>
          <DataTable<User>
            mobile={{ title: "name", badge: "status", actions: "actions", wide: ["email"] }}
            rows={filtered}
            rowKey={(u) => u.id}
            emptyText="Aramanızla eşleşen kullanıcı yok."
            columns={[
              {
                key: "name", header: "Kullanıcı",
                render: (u) => (
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white/[0.04] font-serif text-[12px] text-sand-200">{initials(u.name)}</span>
                    <span className="font-medium text-sand-50">{u.name}</span>
                  </span>
                ),
              },
              { key: "email", header: "E-posta", render: (u) => <span className="text-sand-100/80">{u.email}</span> },
              { key: "role", header: "Rol", render: (u) => <StatusBadge status={u.role} context="role" dot={false} /> },
              { key: "status", header: "Durum" },
              { key: "lastLogin", header: "Son Giriş", render: (u) => <span className="text-ink-muted">{u.lastLogin}</span> },
              {
                key: "actions", header: "İşlemler", align: "right",
                render: (u) => (
                  <span className="inline-flex gap-1">
                    <IconButton aria-label="Düzenle" onClick={() => openEdit(u)}><Pencil size={14} /></IconButton>
                    <IconButton aria-label="Sil" onClick={() => void remove(u)} className="hover:text-err"><Trash2 size={14} /></IconButton>
                  </span>
                ),
              },
            ]}
          />
        </GlassCard>
      </TabsContent>

      <TabsContent value="roles" className="vs-fade-slide">
        <GlassCard hover={false} as="section">
          <SectionHeader title="Modül İzin Matrisi" subtitle="Bir rolün modüle erişimini anahtarla açıp kapatın" />
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr>
                  <th className="eyebrow hairline-b px-3 pb-2.5 text-left">Modül</th>
                  {(roles ?? []).map((r) => (
                    <th key={r.name} className="hairline-b px-3 pb-2.5 text-center">
                      <StatusBadge status={r.name} context="role" dot={false} />
                      {r.description && <div className="mt-1 text-[10.5px] font-normal normal-case tracking-normal text-ink-muted">{r.description}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map((mod) => (
                  <tr key={mod} className="vs-row">
                    <td className="border-b border-[rgba(196,178,141,0.07)] px-3 py-2.5 text-sand-100/90">{mod}</td>
                    {(roles ?? []).map((r) => (
                      <td key={r.name} className="border-b border-[rgba(196,178,141,0.07)] px-3 py-2.5 text-center">
                        <Switch
                          size="sm"
                          checked={Boolean(r.permissions[mod])}
                          disabled={r.name === "Admin"}
                          onCheckedChange={(v) => togglePerm(r, mod, Boolean(v))}
                          aria-label={`${r.name} – ${mod}`}
                          className="data-checked:bg-sand-300"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12px] text-ink-muted">Admin rolü tüm modüllere sabit erişime sahiptir. Değişiklikler bu oturumda uygulanır.</p>
        </GlassCard>
      </TabsContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong rounded-2xl border-line sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-[20px] font-medium">{editing ? "Kullanıcıyı Düzenle" : "Kullanıcı Ekle"}</DialogTitle>
            <DialogDescription>{editing ? "Bilgileri güncelleyin." : "Yeni kullanıcı için ad, e-posta ve rol girin."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Ad Soyad</Label>
              <Input id="u-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl border-line bg-navy-900/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">E-posta</Label>
              <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="rounded-xl border-line bg-navy-900/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as User["role"] }))}>
                  <SelectTrigger className="w-full rounded-xl border-line bg-navy-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl border-line">{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as User["status"] }))}>
                  <SelectTrigger className="w-full rounded-xl border-line bg-navy-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong rounded-xl border-line"><SelectItem value="Aktif">Aktif</SelectItem><SelectItem value="Pasif">Pasif</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <GlassButton onClick={() => setOpen(false)}>Vazgeç</GlassButton>
            <PrimaryButton onClick={() => void submit()} disabled={!form.name.trim() || !form.email.trim()}>{editing ? "Güncelle" : "Ekle"}</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
