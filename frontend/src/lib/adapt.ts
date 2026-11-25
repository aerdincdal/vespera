/* ------------------------------------------------------------------ */
/*  Backend → frontend shape adapters.                                 */
/*  The FastAPI backend returns richer / differently keyed objects     */
/*  (numeric deltas, column objects, row objects, status keys…).       */
/*  Everything the UI consumes goes through here so components stay    */
/*  identical for API and mock data.                                   */
/* ------------------------------------------------------------------ */

import type {
  AnalyticsResponse, AvailableWidget, ChatResponse, DashboardData, Dataset, DataSource, Kpi, Location,
  ModuleData, Report, Role, ScenarioResponse, Section, ThemeColors, UploadResult, Widget,
} from "./types";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (v === undefined || v === null ? fallback : String(v));
const num = (v: unknown, fallback = 0): number => (typeof v === "number" ? v : Number(v ?? fallback) || fallback);

/** 2.3 → "+2.3%", -3 → "-3", "+12%" → "+12%" */
export function deltaToString(delta: unknown, label?: unknown, suffix = "%"): string | undefined {
  if (typeof label === "string" && label.trim()) return label;
  if (typeof delta === "number") return `${delta > 0 ? "+" : ""}${delta}${suffix}`;
  if (typeof delta === "string") return delta;
  return undefined;
}

const enThousands = (n: number) => n.toLocaleString("en-US");

export function adaptKpi(raw: Rec): Kpi {
  const delta = deltaToString(raw.delta, raw.deltaLabel);
  return {
    key: str(raw.key),
    label: str(raw.label),
    value: (typeof raw.value === "number" || typeof raw.value === "string") ? raw.value : str(raw.value),
    unit: raw.unit ? str(raw.unit) : undefined,
    delta,
    // when the label was consumed as the chip text, don't repeat it as a caption
    deltaLabel: typeof raw.delta === "number" ? undefined : (raw.deltaLabel ? str(raw.deltaLabel) : undefined),
    description: raw.description ? str(raw.description) : undefined,
    color: raw.color ? str(raw.color) : undefined,
    icon: raw.icon ? str(raw.icon) : undefined,
  };
}

export function adaptDashboard(raw: Rec): DashboardData {
  const f = isRec(raw.forecast) ? raw.forecast : {};
  const unit = str(f.unit, "Birim");
  const asUnits = (v: unknown) => (typeof v === "number" ? `${enThousands(v)} ${unit}` : str(v));
  const conf = f.confidence;
  return {
    kpis: Array.isArray(raw.kpis) ? raw.kpis.filter(isRec).map(adaptKpi) : [],
    machineSeries: Array.isArray(raw.machineSeries) ? (raw.machineSeries as DashboardData["machineSeries"]) : [],
    personnel: Array.isArray(raw.personnel) ? (raw.personnel as DashboardData["personnel"]) : [],
    forecast: {
      thisWeek: asUnits(f.thisWeek),
      nextWeek: asUnits(f.nextWeek),
      trend: deltaToString(f.trend, f.trendLabel) ?? "",
      confidence: typeof conf === "number" ? `${conf}%` : str(conf),
    },
    indicators: Array.isArray(raw.indicators) ? (raw.indicators as DashboardData["indicators"]) : [],
  };
}

const SWOT_TITLES: Record<string, string> = {
  strengths: "Güçlü Yönler",
  weaknesses: "Zayıf Yönler",
  opportunities: "Fırsatlar",
  threats: "Tehditler",
};

const LINE_STATUS: Record<string, string> = { running: "Çalışıyor", stopped: "Durdu", maintenance: "Bakımda" };

export function adaptSection(raw: Rec): Section | null {
  const type = str(raw.type);
  const title = str(raw.title);

  if (type === "table") {
    const cols = Array.isArray(raw.columns) ? raw.columns : [];
    const colObjs = cols.filter(isRec);
    if (colObjs.length && colObjs.length === cols.length) {
      const keys = colObjs.map((c) => str(c.key));
      const rows = (Array.isArray(raw.rows) ? raw.rows : []).map((r) =>
        isRec(r) ? keys.map((k) => (r[k] as string | number) ?? "") : (r as Array<string | number>),
      );
      const progressCol = raw.progressKey ? colObjs.find((c) => str(c.key) === str(raw.progressKey)) : undefined;
      return {
        type: "table",
        title,
        columns: colObjs.map((c) => str(c.label ?? c.key)),
        rows,
        align: colObjs.map((c) => (c.align === "right" ? "right" : "left")),
        progressColumn: progressCol ? str(progressCol.label ?? progressCol.key) : undefined,
      };
    }
    return raw as unknown as Section;
  }

  if (type === "cards") {
    const items = Array.isArray(raw.cards) ? raw.cards : Array.isArray(raw.items) ? raw.items : [];
    const recs = items.filter(isRec);
    const total = recs.reduce((s, c) => s + (typeof c.value === "number" ? c.value : 0), 0);
    return {
      type: "cards",
      title,
      cards: recs.map((c) => ({
        title: str(c.title),
        value: (c.value as string | number) ?? "",
        subtitle: c.subtitle ? str(c.subtitle) : c.unit ? str(c.unit) : undefined,
        status: c.status ? str(c.status) : undefined,
        progress: typeof c.progress === "number" ? c.progress : total && typeof c.value === "number" ? Math.round((c.value / total) * 100) : undefined,
        meta: c.meta ? str(c.meta) : undefined,
      })),
    };
  }

  // Backend "lines" = production lines list → render as status cards
  if (type === "lines" && Array.isArray(raw.items)) {
    return {
      type: "cards",
      title,
      cards: raw.items.filter(isRec).map((l) => {
        const plan = num(l.plan), actual = num(l.actual);
        return {
          title: str(l.name),
          status: str(l.statusLabel) || LINE_STATUS[str(l.status)] || str(l.status),
          value: `${num(l.oee)}%`,
          subtitle: "OEE",
          progress: plan ? Math.min(100, Math.round((actual / plan) * 100)) : undefined,
          meta: `Plan / Gerçek: ${enThousands(plan)} / ${enThousands(actual)} birim`,
        };
      }),
    };
  }

  if (type === "swot" && !Array.isArray(raw.quadrants)) {
    const keys = ["strengths", "weaknesses", "opportunities", "threats"] as const;
    return {
      type: "swot",
      title,
      quadrants: keys.map((k) => ({ key: k, title: SWOT_TITLES[k], items: Array.isArray(raw[k]) ? (raw[k] as string[]) : [] })),
    };
  }

  if (type === "chart") {
    const unit = raw.unit ? str(raw.unit) : /₺M/.test(title) ? "₺M" : /%/.test(title) ? "%" : undefined;
    return { ...(raw as unknown as Extract<Section, { type: "chart" }>), unit };
  }

  if (type === "progress" || type === "swot" || type === "lines") return raw as unknown as Section;
  return null;
}

export function adaptModule(raw: Rec, slug: string): ModuleData {
  return {
    slug: str(raw.slug, slug),
    title: str(raw.title),
    subtitle: raw.subtitle ? str(raw.subtitle) : undefined,
    icon: str(raw.icon, "layout-grid"),
    kpis: Array.isArray(raw.kpis) ? raw.kpis.filter(isRec).map(adaptKpi) : [],
    sections: (Array.isArray(raw.sections) ? raw.sections : []).filter(isRec).map(adaptSection).filter((s): s is Section => s !== null),
    tools: Array.isArray(raw.tools) ? (raw.tools as ModuleData["tools"]) : [],
    toolsTitle: raw.toolsTitle ? str(raw.toolsTitle) : undefined,
  };
}

const PERF_LABEL: Record<string, Location["performance"]> = { high: "Yüksek", medium: "Orta", low: "Düşük" };

export function adaptLocations(raw: unknown): Location[] {
  const list = Array.isArray(raw) ? raw : isRec(raw) && Array.isArray(raw.items) ? raw.items : [];
  return list.filter(isRec).map((l) => ({
    id: str(l.id),
    name: str(l.name),
    region: str(l.region),
    type: str(l.type),
    performance: (str(l.performanceLabel) as Location["performance"]) || PERF_LABEL[str(l.performance)] || (str(l.performance) as Location["performance"]),
    value: num(l.value),
    trend: deltaToString(l.trend, l.trendLabel) ?? "",
    lat: num(l.lat),
    lng: num(l.lng),
  }));
}

export function adaptDatasets(raw: unknown): Dataset[] {
  return (Array.isArray(raw) ? raw : []).filter(isRec).map((d) => ({
    id: str(d.id),
    label: str(d.label ?? d.name),
    metrics: Array.isArray(d.metrics) ? (d.metrics as string[]) : [],
  }));
}

export function adaptAnalytics(raw: Rec): AnalyticsResponse {
  const ds = isRec(raw.dataset) ? str(raw.dataset.id) : str(raw.dataset);
  const stats = (Array.isArray(raw.stats) ? raw.stats : []).filter(isRec).map((s) => ({
    metric: str(s.metric), mean: num(s.mean), min: num(s.min), max: num(s.max), std: num(s.std),
    trend: deltaToString(s.trend, s.trendLabel) ?? "",
  }));
  const series = Array.isArray(raw.series) ? (raw.series as AnalyticsResponse["series"]) : [];
  const metrics = Array.isArray(raw.metrics) && raw.metrics.length
    ? (raw.metrics as string[])
    : stats.map((s) => s.metric);
  return {
    dataset: ds,
    groupBy: str(raw.groupBy, "day"),
    series,
    metrics,
    stats,
    correlation: isRec(raw.correlation) ? (raw.correlation as AnalyticsResponse["correlation"]) : { labels: [], matrix: [] },
  };
}

export function adaptScenario(raw: Rec): ScenarioResponse {
  const pick = (r: unknown): ScenarioResponse["baseline"] => {
    const o = isRec(r) ? r : {};
    return { production: num(o.production ?? o.units), revenue: num(o.revenue), cost: num(o.cost), profit: num(o.profit) };
  };
  return {
    baseline: pick(raw.baseline),
    scenario: pick(raw.scenario),
    series: (Array.isArray(raw.series) ? raw.series : []).filter(isRec).map((p) => ({
      month: str(p.month), baseline: num(p.baseline), scenario: num(p.scenario),
    })),
  };
}

const TYPE_KEY: Record<string, Widget["type"]> = { Grafik: "chart", Pasta: "pie", Tablo: "table", Çubuk: "bar", İlerleme: "progress" };
const SIZE_KEY: Record<string, Widget["size"]> = { Geniş: "wide", Orta: "medium", Dar: "narrow" };

export function adaptWidget(raw: Rec): Widget {
  const typeKey = str(raw.typeKey) as Widget["type"];
  const sizeKey = str(raw.sizeKey) as Widget["size"];
  const type = typeKey || TYPE_KEY[str(raw.type)] || (str(raw.type) as Widget["type"]);
  const size = sizeKey || SIZE_KEY[str(raw.size)] || (str(raw.size) as Widget["size"]);
  return {
    id: str(raw.id),
    title: str(raw.title),
    type,
    typeLabel: str(raw.typeLabel ?? raw.type),
    size,
    sizeLabel: str(raw.sizeLabel ?? raw.size),
    enabled: raw.enabled !== false,
    order: num(raw.order),
  };
}

export function adaptAvailableWidgets(raw: unknown): AvailableWidget[] {
  return (Array.isArray(raw) ? raw : []).filter(isRec).map((w) => {
    const a = adaptWidget(w);
    return { key: str(w.key ?? w.id), title: a.title, type: a.type, size: a.size };
  });
}

/** Backend theme: {colors:[{key,value}], flat:{…}} → flat ThemeColors (danger → error) */
export function adaptTheme(raw: Rec, fallback: ThemeColors): ThemeColors {
  const flat: Rec = isRec(raw.flat) ? raw.flat : Object.fromEntries((Array.isArray(raw.colors) ? raw.colors : []).filter(isRec).map((c) => [str(c.key), c.value]));
  const g = (k: string, alt?: string) => str(flat[k] ?? (alt ? flat[alt] : undefined), "");
  return {
    primary: g("primary") || fallback.primary,
    secondary: g("secondary") || fallback.secondary,
    accent: g("accent") || fallback.accent,
    success: g("success") || fallback.success,
    warning: g("warning") || fallback.warning,
    error: g("error", "danger") || fallback.error,
    background: g("background") || fallback.background,
    card: g("card") || fallback.card,
    text: g("text") || fallback.text,
  };
}

export function themeToBackend(t: ThemeColors): { colors: Array<{ key: string; value: string }> } {
  return {
    colors: Object.entries(t).map(([k, v]) => ({ key: k === "error" ? "danger" : k, value: v })),
  };
}

/** Backend roles: {modules:[{slug,title}], roles:[{name, permissions:{slug:{view,edit,delete}}}]} → Role[] keyed by module title */
export function adaptRoles(raw: unknown): Role[] {
  if (Array.isArray(raw)) return raw as Role[];
  if (!isRec(raw)) return [];
  const modules = (Array.isArray(raw.modules) ? raw.modules : []).filter(isRec);
  const titleOf = Object.fromEntries(modules.map((m) => [str(m.slug), str(m.title)]));
  return (Array.isArray(raw.roles) ? raw.roles : []).filter(isRec).map((r) => {
    const perms = isRec(r.permissions) ? r.permissions : {};
    const flat: Record<string, boolean> = {};
    for (const [slug, p] of Object.entries(perms)) {
      const allowed = isRec(p) ? p.view === true : Boolean(p);
      flat[titleOf[slug] ?? slug] = allowed;
    }
    return { name: str(r.name) as Role["name"], description: r.description ? str(r.description) : undefined, permissions: flat };
  });
}

export function adaptReport(raw: Rec): Report {
  return {
    id: str(raw.id),
    name: str(raw.name),
    reportType: str(raw.reportType ?? raw.type, "Özet Rapor"),
    description: str(raw.description),
    components: Array.isArray(raw.components) ? (raw.components as Report["components"]) : [],
    updatedAt: raw.updatedAt ? str(raw.updatedAt) : undefined,
  };
}

export function adaptDataSource(raw: Rec): DataSource {
  const cols = Array.isArray(raw.columns) ? raw.columns.map((c) => (isRec(c) ? str(c.name ?? c.key) : str(c))) : undefined;
  return {
    id: str(raw.id),
    name: str(raw.name),
    type: str(raw.type),
    connection: str(raw.connection),
    recordCount: str(raw.recordCount ?? raw.rows),
    size: str(raw.size ?? raw.sizeLabel),
    updatedAt: str(raw.updatedAt ?? raw.lastUpdated),
    status: (str(raw.status) as DataSource["status"]) || (raw.connected === false ? "Bağlantı Yok" : "Bağlı"),
    columns: cols,
    preview: cols && Array.isArray(raw.preview) ? rowsToArrays(raw.preview, cols) : undefined,
  };
}

function rowsToArrays(rows: unknown[], cols: string[]): Array<Array<string | number>> {
  return rows.map((r) => (isRec(r) ? cols.map((c) => (r[c] as string | number) ?? "") : (r as Array<string | number>)));
}

const fmtBytes = (b: number) => (b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : b >= 1024 ? `${Math.round(b / 1024)} KB` : `${b} B`);

export function adaptUpload(raw: Rec): UploadResult {
  const cols = Array.isArray(raw.columns) ? raw.columns.map((c) => (isRec(c) ? str(c.name ?? c.key) : str(c))) : [];
  return {
    id: str(raw.id),
    name: str(raw.name),
    rows: num(raw.rows),
    columns: cols,
    preview: Array.isArray(raw.preview) ? rowsToArrays(raw.preview, cols) : [],
    summary: { type: raw.type, size: typeof raw.sizeBytes === "number" ? fmtBytes(raw.sizeBytes) : undefined, columnCount: raw.columnCount },
  };
}

export function adaptChat(raw: Rec): ChatResponse {
  const out: ChatResponse = { reply: str(raw.reply) };
  if (isRec(raw.table)) {
    const colsRaw = Array.isArray(raw.table.columns) ? raw.table.columns : [];
    const keys = colsRaw.map((c) => (isRec(c) ? str(c.key) : str(c)));
    const labels = colsRaw.map((c) => (isRec(c) ? str(c.label ?? c.key) : str(c)));
    const rows = (Array.isArray(raw.table.rows) ? raw.table.rows : []).map((r) => (isRec(r) ? keys.map((k) => (r[k] as string | number) ?? "") : (r as Array<string | number>)));
    out.table = { columns: labels, rows };
  }
  if (isRec(raw.chart) && Array.isArray(raw.chart.data)) {
    const t = str(raw.chart.type);
    const type: "bar" | "line" | "pie" = t === "pie" ? "pie" : t === "line" ? "line" : "bar";
    const data = raw.chart.data as Array<Record<string, number | string>>;
    const first = data[0] ?? {};
    const xKey = str(raw.chart.xKey ?? raw.chart.x, "name" in first ? "name" : Object.keys(first)[0] ?? "name");
    const yKeys = Array.isArray(raw.chart.yKeys) && raw.chart.yKeys.length
      ? (raw.chart.yKeys as string[])
      : raw.chart.y ? [str(raw.chart.y)] : Object.keys(first).filter((k) => k !== xKey && typeof first[k] === "number");
    out.chart = { type, data, xKey, yKeys };
  }
  return out;
}

/* ---------------- v2: notifications + live ---------------- */

import type { LiveData, Notification, NotificationLevel } from "./types";

const LEVELS: Record<string, NotificationLevel> = {
  info: "info", warn: "warn", warning: "warn", err: "err", error: "err", danger: "err", critical: "err", ok: "ok", success: "ok",
};

export function adaptNotification(raw: Rec): Notification {
  return {
    id: str(raw.id),
    title: str(raw.title),
    body: str(raw.body ?? raw.message),
    level: LEVELS[str(raw.level).toLowerCase()] ?? "info",
    time: str(raw.time ?? raw.createdAt ?? raw.ts),
    read: raw.read === true,
    href: raw.href ? str(raw.href) : undefined,
  };
}

export function adaptNotifications(raw: unknown): Notification[] {
  const list = Array.isArray(raw) ? raw : isRec(raw) && Array.isArray(raw.items) ? raw.items : [];
  return list.filter(isRec).map(adaptNotification).filter((n) => n.id);
}

export function adaptLive(raw: Rec): LiveData {
  const plant = isRec(raw.plant) ? raw.plant : {};
  return {
    ts: str(raw.ts, new Date().toISOString()),
    lines: (Array.isArray(raw.lines) ? raw.lines : []).filter(isRec).map((l) => ({
      name: str(l.name),
      oee: num(l.oee),
      rate: num(l.rate),
      temp: typeof l.temp === "number" ? l.temp : undefined,
      status: l.status ? str(l.statusLabel) || LINE_STATUS[str(l.status)] || str(l.status) : undefined,
    })),
    plant: { energyKw: num(plant.energyKw), activeStaff: num(plant.activeStaff), openAlerts: num(plant.openAlerts) },
  };
}
