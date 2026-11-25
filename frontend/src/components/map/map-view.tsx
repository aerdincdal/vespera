"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { HelpCircle, Layers, MapPin, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { locationsMock } from "@/lib/mock";
import { useApi } from "@/lib/use-api";
import type { Location } from "@/lib/types";
import { fmtTRY } from "@/lib/format";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { DataTable } from "@/components/vespera/data-table";
import { StatusBadge } from "@/components/vespera/status-badge";
import { GlassButton, PrimaryButton } from "@/components/vespera/buttons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Shimmer } from "@/components/vespera/shimmer";
import { PERF_COLOR } from "./perf";
import { CountUp } from "@/components/vespera/count-up";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <Shimmer className="h-full w-full rounded-2xl" />,
});

const ALL = "Tümü";

export function MapView() {
  const { data, loading } = useApi(api.locations, locationsMock);
  const all = useMemo(() => data ?? [], [data]);
  const [draft, setDraft] = useState({ region: ALL, type: ALL, perf: ALL });
  const [applied, setApplied] = useState(draft);
  const [labels, setLabels] = useState(true);

  const regions = useMemo(() => [ALL, ...Array.from(new Set(all.map((l) => l.region)))], [all]);
  const types = useMemo(() => [ALL, ...Array.from(new Set(all.map((l) => l.type)))], [all]);
  const perfs = [ALL, "Yüksek", "Orta", "Düşük"];

  const filtered = useMemo(
    () =>
      all.filter(
        (l) =>
          (applied.region === ALL || l.region === applied.region) &&
          (applied.type === ALL || l.type === applied.type) &&
          (applied.perf === ALL || l.performance === applied.perf),
      ),
    [all, applied],
  );
  const total = filtered.reduce((a, b) => a + b.value, 0);
  const count = (p: Location["performance"]) => filtered.filter((l) => l.performance === p).length;

  return (
    <>
      <PageHeader
        title="Harita Entegrasyonu"
        subtitle="Lokasyonların bölgesel dağılımı ve performansı; daire büyüklüğü değeri, rengi performansı gösterir."
        actions={
          <>
            <Popover>
              <PopoverTrigger render={<GlassButton />}>
                <Layers size={15} strokeWidth={1.5} /> Katmanlar
              </PopoverTrigger>
              <PopoverContent align="end" className="glass-strong w-64 rounded-2xl border-line p-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-sand-100">Yer adları</span>
                  <Switch checked={labels} onCheckedChange={(v) => setLabels(Boolean(v))} aria-label="Yer adları katmanı" />
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <div className="eyebrow mb-2">Performans renkleri</div>
                  <ul className="space-y-1.5">
                    {(Object.keys(PERF_COLOR) as Array<keyof typeof PERF_COLOR>).map((k) => (
                      <li key={k} className="flex items-center gap-2 text-sand-100/85">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PERF_COLOR[k] }} /> {k}
                      </li>
                    ))}
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger render={<GlassButton />}>
                <HelpCircle size={15} strokeWidth={1.5} /> Yardım
              </PopoverTrigger>
              <PopoverContent align="end" className="glass-strong w-72 rounded-2xl border-line p-4 text-[13px] text-sand-100/85">
                Filtreleri seçip <span className="text-sand-50">Filtreleri Uygula</span> ile harita ve listeyi daraltın. Bir daireye tıklayarak lokasyon detayını görün. Fare tekerleği yerine +/− ile yakınlaştırın.
              </PopoverContent>
            </Popover>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-3">
          <GlassCard hover={false} as="section">
            <SectionHeader title="Filtreler" />
            <div className="space-y-4">
              <FilterSelect label="Bölge" value={draft.region} options={regions} onChange={(v) => setDraft((d) => ({ ...d, region: v }))} />
              <FilterSelect label="Lokasyon Tipi" value={draft.type} options={types} onChange={(v) => setDraft((d) => ({ ...d, type: v }))} />
              <FilterSelect label="Performans" value={draft.perf} options={perfs} onChange={(v) => setDraft((d) => ({ ...d, perf: v }))} />
              <PrimaryButton className="w-full" onClick={() => setApplied(draft)}>
                <SlidersHorizontal size={15} strokeWidth={1.5} /> Filtreleri Uygula
              </PrimaryButton>
            </div>
          </GlassCard>

          <GlassCard hover={false} as="section">
            <SectionHeader title="Özet Bilgiler" />
            <dl className="space-y-4">
              <div>
                <dt className="eyebrow">Toplam Lokasyon</dt>
                <dd className="tnum mt-1 font-serif text-[26px] font-medium text-sand-50"><CountUp value={filtered.length} /></dd>
              </div>
              <div>
                <dt className="eyebrow">Toplam Değer</dt>
                <dd className="tnum mt-1 font-serif text-[26px] font-medium text-steel"><CountUp value={fmtTRY(total)} /></dd>
              </div>
              <div>
                <dt className="eyebrow mb-2">Performans Dağılımı</dt>
                <dd className="space-y-1.5 text-[13px]">
                  {(["Yüksek", "Orta", "Düşük"] as const).map((p) => (
                    <div key={p} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sand-100/85">
                        <span className="h-2 w-2 rounded-full" style={{ background: PERF_COLOR[p] }} /> {p}
                      </span>
                      <span className="tnum font-medium text-sand-50">{count(p)}</span>
                    </div>
                  ))}
                </dd>
              </div>
            </dl>
          </GlassCard>
        </div>

        <GlassCard hover={false} padded={false} className="min-h-[340px] overflow-hidden max-lg:order-first sm:min-h-[420px] lg:col-span-9 lg:min-h-[560px]">
          <div className="h-[340px] sm:h-[420px] lg:h-full">{!loading && <LocationMap points={filtered} layers={{ labels }} />}</div>
        </GlassCard>
      </div>

      <GlassCard hover={false} className="mt-6" as="section">
        <SectionHeader title="Lokasyon Listesi" subtitle={`${filtered.length} lokasyon listeleniyor`} />
        <DataTable<Location>
          mobile={{ title: "name", badge: "performance" }}
          rows={filtered}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "name", header: "Lokasyon",
              render: (r) => (
                <span className="flex items-center gap-2 font-medium text-sand-50">
                  <MapPin size={14} strokeWidth={1.5} style={{ color: PERF_COLOR[r.performance] }} /> {r.name}
                </span>
              ),
            },
            { key: "region", header: "Bölge" },
            { key: "type", header: "Tip" },
            { key: "performance", header: "Performans", render: (r) => <StatusBadge status={r.performance} context="performance" /> },
            { key: "value", header: "Değer", align: "right", render: (r) => <span className="tnum">{fmtTRY(r.value)}</span> },
            { key: "trend", header: "Trend", align: "right" },
          ]}
        />
      </GlassCard>
    </>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="eyebrow">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(String(v))}>
        <SelectTrigger className="h-9 w-full rounded-xl border-line bg-white/[0.04] text-[13px]" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="glass-strong rounded-xl border-line">
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
