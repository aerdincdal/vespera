"use client";

import { useState } from "react";
import { Check, Palette, Plus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ThemeColors } from "@/lib/types";
import { DEFAULT_THEME, THEME_PRESETS, THEME_SCHEMES, useThemeStore } from "@/store/theme";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { GlassButton, PrimaryButton } from "@/components/vespera/buttons";
import { KpiCard } from "@/components/vespera/kpi-card";
import { StatusBadge } from "@/components/vespera/status-badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const FIELDS: Array<{ key: keyof ThemeColors; label: string; hint: string }> = [
  { key: "primary", label: "Ana Renk", hint: "Butonlar, aktif menü, KPI vurgusu" },
  { key: "secondary", label: "İkincil Renk", hint: "Başlık vurgusu ve ikonlar" },
  { key: "accent", label: "Vurgu Rengi", hint: "Bakır ton: üçüncü seri ve öne çıkan öğeler" },
  { key: "success", label: "Başarı", hint: "Olumlu durum ve artışlar" },
  { key: "warning", label: "Uyarı", hint: "Dikkat gerektiren durumlar" },
  { key: "error", label: "Hata", hint: "Kritik durum ve düşüşler" },
  { key: "background", label: "Arka Plan", hint: "Sayfa zemini" },
  { key: "card", label: "Kart Arka Planı", hint: "Cam altındaki ton" },
  { key: "text", label: "Metin Rengi", hint: "Ana metin" },
];

export function ThemeView() {
  const { colors, setColor, setColors, reset } = useThemeStore();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [custom, setCustom] = useState<Array<{ id: string; name: string; colors: ThemeColors }>>([]);

  const presets = [...THEME_PRESETS, ...custom];
  const activePreset = presets.find((p) => JSON.stringify(p.colors) === JSON.stringify(colors))?.id;

  async function save() {
    setSaving(true);
    try {
      await api.themePut(colors);
      toast.success("Tema kaydedildi", { description: "Renkler sunucuya yazıldı ve bu tarayıcıda saklandı." });
    } catch {
      toast.info("Tema yerel olarak kaydedildi", { description: "Backend erişilemedi; renkler tarayıcınızda saklandı." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={Palette}
        title="Tema Özelleştirme"
        subtitle="Renkler CSS değişkenlerine canlı uygulanır; beğendiğinizde kaydedin."
        actions={
          <>
            <GlassButton onClick={() => { reset(); toast("Varsayılan tema geri yüklendi"); }}>
              <RotateCcw size={14} strokeWidth={1.5} /> Sıfırla
            </GlassButton>
            <PrimaryButton onClick={() => setOpen(true)}>
              <Plus size={15} strokeWidth={2} /> Yeni Tema Oluştur
            </PrimaryButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <GlassCard hover={false} as="section">
            <SectionHeader title="Hazır Temalar" />
            <ul className="space-y-2">
              {presets.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setColors(p.colors)}
                    aria-pressed={activePreset === p.id}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      activePreset === p.id ? "border-sand-300/50 bg-[rgba(196,178,141,0.12)]" : "border-line hover:bg-white/[0.04]",
                    )}
                  >
                    <span className="text-[13.5px] text-sand-50">{p.name}</span>
                    <span className="flex items-center gap-1.5">
                      {[p.colors.background, p.colors.card, p.colors.primary, p.colors.accent].map((c, i) => (
                        <span key={i} className="h-4 w-4 rounded-full border border-white/10" style={{ background: c }} />
                      ))}
                      {activePreset === p.id && <Check size={14} className="ml-1 text-sand-300" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard hover={false} as="section">
            <SectionHeader title="Renk Şemaları" subtitle="Yalnızca ana ve ikincil rengi değiştirir" />
            <div className="grid grid-cols-2 gap-2">
              {THEME_SCHEMES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setColor("primary", s.primary); setColor("secondary", s.secondary); }}
                  className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-left text-[13px] text-sand-50 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="h-5 w-5 rounded-full" style={{ background: `linear-gradient(135deg, ${s.primary}, ${s.secondary})` }} />
                  {s.name} Tema
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <GlassCard hover={false} as="section">
            <SectionHeader
              title="Renk Ayarları"
              action={
                <PrimaryButton onClick={save} disabled={saving}>
                  <Save size={14} strokeWidth={1.75} /> {saving ? "Kaydediliyor…" : "Kaydet"}
                </PrimaryButton>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-3">
                  <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/10" style={{ background: colors[f.key] }}>
                    <input
                      type="color"
                      value={colors[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      aria-label={`${f.label} renk seçici`}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-sand-50">{f.label}</div>
                    <div className="truncate text-[11.5px] text-ink-muted">{f.hint}</div>
                  </div>
                  <Input
                    value={colors[f.key]}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(f.key, v);
                    }}
                    aria-label={`${f.label} hex`}
                    className="tnum h-8 w-24 rounded-lg border-line bg-navy-900/50 font-mono text-[12px] uppercase"
                  />
                  <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/10" style={{ background: colors[f.key] }} aria-hidden />
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard hover={false} as="section">
            <SectionHeader title="Önizleme" subtitle="Seçili renklerle örnek bileşenler" />
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard kpi={{ key: "p", label: "Örnek KPI", value: "92.5", unit: "%", delta: "+2.3%", description: "Ana renk şeridi ve delta" }} />
              <div className="rounded-2xl border border-line bg-white/[0.03] p-5">
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton>Birincil</PrimaryButton>
                  <GlassButton>İkincil</GlassButton>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge status="Çalışıyor" />
                  <StatusBadge status="Bakımda" />
                  <StatusBadge status="Durdu" />
                  <StatusBadge status="Planlandı" />
                </div>
                <p className="mt-4 text-[13px] text-sand-100/85">Metin rengi ve <span className="text-ink-muted">ikincil metin</span> böyle görünür.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong rounded-2xl border-line sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-[20px] font-medium">Yeni Tema Oluştur</DialogTitle>
            <DialogDescription>Mevcut renk ayarları yeni bir hazır tema olarak kaydedilir.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="theme-name">Tema Adı</Label>
            <Input id="theme-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Örn. Sonbahar" className="rounded-xl border-line bg-navy-900/50" />
          </div>
          <DialogFooter>
            <GlassButton onClick={() => setOpen(false)}>Vazgeç</GlassButton>
            <PrimaryButton
              disabled={!newName.trim()}
              onClick={() => {
                setCustom((c) => [...c, { id: `c-${Date.now()}`, name: newName.trim(), colors: { ...colors } }]);
                setNewName("");
                setOpen(false);
                toast.success("Tema oluşturuldu", { description: newName.trim() });
              }}
            >
              Oluştur
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { DEFAULT_THEME };
