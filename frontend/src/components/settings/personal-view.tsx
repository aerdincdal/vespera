"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, GripVertical, LayoutGrid, Plus, X } from "lucide-react";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { availableWidgetsMock, widgetsMock } from "@/lib/mock";
import { useApi, tryApi, newId } from "@/lib/use-api";
import type { AvailableWidget, Widget } from "@/lib/types";
import { useWidgetOrder } from "@/store/widgets";
import { useStudioWidgets, type StudioWidget } from "@/store/studio";
import { StudioChart } from "@/components/charts/studio-chart";
import { PageHeader } from "@/components/vespera/page-header";
import { GlassCard } from "@/components/vespera/glass-card";
import { SectionHeader } from "@/components/vespera/section-header";
import { DataTable } from "@/components/vespera/data-table";
import { PrimaryButton, IconButton } from "@/components/vespera/buttons";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/vespera/status-badge";
import { EmptyState } from "@/components/vespera/empty-state";
import { CardSkeleton } from "@/components/vespera/shimmer";
import { AreaChart } from "@/components/charts/area-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { MatrixTable } from "@/components/vespera/data-table";
import { ProgressRow } from "@/components/vespera/progress-row";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/vespera/export-button";
import { exportTable } from "@/lib/export";

const SIZE_LABEL: Record<Widget["size"], string> = { wide: "Geniş", medium: "Orta", narrow: "Dar" };
const TYPE_LABEL: Record<Widget["type"], string> = { chart: "Grafik", pie: "Pasta", table: "Tablo", bar: "Sütun", progress: "İlerleme" };
const SIZE_COLS: Record<Widget["size"], string> = { wide: "lg:col-span-12", medium: "lg:col-span-7", narrow: "lg:col-span-5" };

export function PersonalView() {
  const { data, loading, setData } = useApi(api.widgets, widgetsMock);
  const { data: available } = useApi(api.widgetsAvailable, availableWidgetsMock);
  const { order, setOrder } = useWidgetOrder();
  const studioWidgets = useStudioWidgets((s) => s.widgets);
  const removeStudio = useStudioWidgets((s) => s.remove);
  const [hiddenStudio, setHiddenStudio] = useState<string[]>([]);
  // Studio-made widgets live in local storage and are layered over the API/mock list.
  const widgets = useMemo<Widget[]>(() => {
    const base = data ?? [];
    const ids = new Set(base.map((w) => w.id));
    return [...base, ...studioWidgets.filter((w) => !ids.has(w.id)).map((w) => ({ ...w, enabled: w.enabled && !hiddenStudio.includes(w.id) }))];
  }, [data, studioWidgets, hiddenStudio]);
  const studioById = useMemo(() => new Map(studioWidgets.map((w) => [w.id, w])), [studioWidgets]);

  const sorted = useMemo(() => {
    const idx = new Map(order.map((id, i) => [id, i]));
    return [...widgets].sort((a, b) => (idx.get(a.id) ?? 1000 + a.order) - (idx.get(b.id) ?? 1000 + b.order));
  }, [widgets, order]);
  const visible = sorted.filter((w) => w.enabled);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function toggle(w: Widget, enabled: boolean) {
    if (studioById.has(w.id)) { setHiddenStudio((h) => (enabled ? h.filter((id) => id !== w.id) : [...h, w.id])); return; }
    setData((prev) => (prev ?? []).map((x) => (x.id === w.id ? { ...x, enabled } : x)));
    await tryApi(() => api.widgetPatch(w.id, { enabled }), () => w);
  }
  async function remove(w: Widget) {
    if (studioById.has(w.id)) removeStudio(w.id);
    setData((prev) => (prev ?? []).filter((x) => x.id !== w.id));
    await tryApi(() => api.widgetDelete(w.id), () => undefined);
    toast("Widget kaldırıldı", { description: w.title });
  }
  async function add(a: AvailableWidget) {
    if (widgets.some((w) => w.title === a.title)) {
      toast.info("Bu widget zaten ekli", { description: a.title });
      return;
    }
    const local: Widget = { id: newId(`local-${a.key}`), title: a.title, type: a.type, typeLabel: TYPE_LABEL[a.type], size: a.size, sizeLabel: SIZE_LABEL[a.size], enabled: true, order: widgets.length };
    const { result } = await tryApi(() => api.widgetAdd({ key: a.key, title: a.title, type: a.type, size: a.size }), () => local);
    setData((prev) => [...(prev ?? []), { ...local, ...result }]);
    toast.success("Widget eklendi", { description: a.title });
  }
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = visible.map((w) => w.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    const hidden = sorted.filter((w) => !w.enabled).map((w) => w.id);
    setOrder([...next, ...hidden]);
    next.forEach((id, i) => void tryApi(() => api.widgetPatch(id, { order: i }), () => undefined));
  }

  return (
    <>
      <PageHeader
        icon={LayoutGrid}
        title="Kişisel Dashboard"
        subtitle="Kendi çalışma alanınızı düzenleyin: widget ekleyin, gizleyin ve sürükleyerek sıralayın."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger render={<PrimaryButton />}>
              <Plus size={15} strokeWidth={2} /> Widget Ekle
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong w-64 rounded-2xl border-line p-1.5">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="eyebrow px-2 py-1.5">Eklenebilir Widgetlar</DropdownMenuLabel>
                {(available ?? availableWidgetsMock).map((a) => (
                  <DropdownMenuItem key={a.key} onClick={() => void add(a)} className="rounded-lg px-2 py-2 text-[13px]">
                    <span className="flex-1">{a.title}</span>
                    <span className="text-[11px] text-ink-muted">{TYPE_LABEL[a.type]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="space-y-6">
        <GlassCard hover={false} as="section">
          <SectionHeader
            title="Widget Yönetimi"
            subtitle={loading ? "Yükleniyor…" : `${widgets.length} widget, ${visible.length} görünür`}
            action={<ExportButton disabled={loading} onExport={() => exportTable("widgetlar", ["Widget", "Tip", "Boyut", "Görünür", "Sıra"], sorted.map((w, i) => [w.title, w.typeLabel || TYPE_LABEL[w.type], w.sizeLabel || SIZE_LABEL[w.size], w.enabled ? "Evet" : "Hayır", i + 1]))} />}
          />
          {loading ? <CardSkeleton className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none" lines={3} /> : (
            <DataTable<Widget>
              mobile={{ title: "title", badge: "enabled", actions: "actions" }}
              rows={sorted}
              rowKey={(w) => w.id}
              columns={[
                { key: "title", header: "Widget", render: (w) => <span className="font-medium text-sand-50">{w.title}</span> },
                { key: "typeLabel", header: "Tip", render: (w) => <StatusBadge status={w.typeLabel || TYPE_LABEL[w.type]} dot={false} /> },
                { key: "sizeLabel", header: "Boyut", render: (w) => <span className="text-sand-100/85">{w.sizeLabel || SIZE_LABEL[w.size]}</span> },
                { key: "enabled", header: "Durum", render: (w) => <Switch checked={w.enabled} onCheckedChange={(v) => void toggle(w, Boolean(v))} aria-label={`${w.title} göster`} className="data-checked:bg-sand-300" /> },
                {
                  key: "actions", header: "İşlemler", align: "right",
                  render: (w) => (
                    <span className="inline-flex gap-1">
                      <IconButton aria-label={w.enabled ? "Gizle" : "Göster"} onClick={() => void toggle(w, !w.enabled)}>{w.enabled ? <Eye size={15} /> : <EyeOff size={15} />}</IconButton>
                      <IconButton aria-label="Kaldır" onClick={() => void remove(w)} className="hover:text-err"><X size={15} /></IconButton>
                    </span>
                  ),
                },
              ]}
            />
          )}
        </GlassCard>

        <section>
          <SectionHeader title="Dashboard Görünümü" subtitle="Kartları tutamaçtan sürükleyerek sıralayın" className="mb-4 px-1" />
          {loading ? (
            <div className="grid gap-6 lg:grid-cols-12"><CardSkeleton className="lg:col-span-12" lines={6} /><CardSkeleton className="lg:col-span-5" /><CardSkeleton className="lg:col-span-7" /></div>
          ) : visible.length === 0 ? (
            <EmptyState title="Görünür widget yok" description="Yukarıdaki tablodan bir widget'ı açın veya yeni bir widget ekleyin." />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={visible.map((w) => w.id)} strategy={rectSortingStrategy}>
                <div className="grid gap-6 lg:grid-cols-12">
                  {visible.map((w) => <SortableWidget key={w.id} widget={w} studio={studioById.get(w.id)} onHide={() => void toggle(w, false)} />)}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>
    </>
  );
}

function SortableWidget({ widget, studio, onHide }: { widget: Widget; studio?: StudioWidget; onHide: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(SIZE_COLS[widget.size], isDragging && "z-10 opacity-90")}>
      <GlassCard className={cn("h-full", isDragging && "border-line-strong shadow-2xl")} as="article" aria-label={widget.title}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-serif text-[16px] font-medium text-sand-50">{widget.title}</h3>
          <div className="flex items-center gap-1">
            <button
              ref={setActivatorNodeRef}
              type="button"
              aria-label="Taşı"
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-lg p-1.5 text-sand-200/70 hover:bg-white/[0.06] hover:text-sand-50 active:cursor-grabbing"
            >
              <GripVertical size={15} strokeWidth={1.5} />
            </button>
            <IconButton aria-label="Gizle" onClick={onHide}><EyeOff size={15} /></IconButton>
          </div>
        </div>
        {studio ? <StudioChart config={studio.studio} rows={studio.data} height={260} /> : <WidgetBody widget={widget} />}
      </GlassCard>
    </div>
  );
}

const GG = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"].map((ay, i) => ({
  ay, Gelir: Number((0.82 + i * 0.05).toFixed(2)), Gider: Number((0.55 + i * 0.02).toFixed(2)),
}));

function WidgetBody({ widget }: { widget: Widget }) {
  const t = widget.title.toLowerCase();
  if (widget.type === "chart") return <AreaChart data={GG} xKey="ay" yKeys={["Gelir", "Gider"]} height={240} formatter={(v) => `₺${v.toFixed(2)}M`} />;
  if (widget.type === "pie")
    return <DonutChart height={200} legend="right" unit="%" centerLabel="segment" centerValue="4" data={[{ name: "Kurumsal", value: 42 }, { name: "KOBİ", value: 28 }, { name: "Bayi", value: 18 }, { name: "Bireysel", value: 12 }]} />;
  if (widget.type === "table")
    return (
      <MatrixTable
        dense
        columns={["Bölge", "Satış", "Hedef", "Gerçekleşme"]}
        rows={[["Marmara", "₺1.4M", "₺1.3M", "+7.7%"], ["Ege", "₺820K", "₺900K", "-8.9%"], ["İç Anadolu", "₺610K", "₺600K", "+1.7%"], ["Akdeniz", "₺370K", "₺350K", "+5.7%"]]}
      />
    );
  if (widget.type === "bar") {
    const data = t.includes("departman")
      ? [{ k: "Üretim", Performans: 88 }, { k: "Ar-Ge", Performans: 92 }, { k: "Satış", Performans: 79 }, { k: "Finans", Performans: 85 }, { k: "Lojistik", Performans: 81 }]
      : [{ k: "Marmara", Performans: 91 }, { k: "Ege", Performans: 84 }, { k: "İç Anadolu", Performans: 78 }, { k: "Akdeniz", Performans: 72 }, { k: "Güneydoğu", Performans: 69 }];
    return <BarChart data={data} xKey="k" yKeys={["Performans"]} height={220} unit="%" colorByCategory />;
  }
  const items = t.includes("stok")
    ? [{ label: "Hammadde", value: 72 }, { label: "Yarı Mamul", value: 55 }, { label: "Mamul", value: 88 }, { label: "Yedek Parça", value: 41 }]
    : [{ label: "Üretim", value: 96 }, { label: "Satış", value: 82 }, { label: "Kalite", value: 99 }, { label: "Enerji", value: 74 }];
  return <div className="divide-y divide-[rgba(196,178,141,0.07)]">{items.map((it, i) => <ProgressRow key={it.label} label={it.label} value={it.value} index={i} />)}</div>;
}
