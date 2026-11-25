/* ------------------------------------------------------------------ */
/*  API contract types — mirrors docs/SPEC.md §5                      */
/* ------------------------------------------------------------------ */

export type Tone = "sand" | "steel" | "copper" | "sage" | "rose" | "lavender" | "ok" | "warn" | "err" | "info" | "muted";

export interface Kpi {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaLabel?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface DashboardData {
  kpis: Kpi[];
  machineSeries: Array<Record<string, number | string>>;
  personnel: Array<{ name: string; value: number; color?: string }>;
  forecast: { thisWeek: string; nextWeek: string; trend: string; confidence: string };
  indicators: Array<{ label: string; value: number; color?: string }>;
}

export type Section =
  | { type: "table"; title: string; columns: string[]; rows: Array<Array<string | number>>; align?: Array<"left" | "right">; progressColumn?: string }
  | { type: "cards"; title: string; cards: Array<{ title: string; value: string | number; subtitle?: string; status?: string; progress?: number; meta?: string }> }
  | { type: "progress"; title: string; items: Array<{ label: string; value: number; color?: string }> }
  | { type: "lines"; title: string; series: Array<{ name: string; data: number[] }>; labels: string[] }
  | { type: "swot"; title: string; quadrants: Array<{ key: "strengths" | "weaknesses" | "opportunities" | "threats"; title: string; items: string[] }> }
  | { type: "chart"; title: string; chartType: "area" | "bar" | "line"; data: Array<Record<string, number | string>>; xKey: string; yKeys: string[]; unit?: string };

export interface Tool {
  title: string;
  description: string;
  icon?: string;
}

export interface ModuleData {
  slug: string;
  title: string;
  subtitle?: string;
  icon: string;
  kpis: Kpi[];
  sections: Section[];
  tools: Tool[];
  toolsTitle?: string;
}

export interface Dataset {
  id: string;
  label: string;
  metrics: string[];
}

export interface AnalyticsResponse {
  dataset: string;
  groupBy: string;
  series: Array<Record<string, number | string>>;
  metrics: string[];
  stats: Array<{ metric: string; mean: number; min: number; max: number; std: number; trend: string }>;
  correlation: { labels: string[]; matrix: number[][] };
}

export interface ScenarioInput {
  demandChange: number;
  materialPriceChange: number;
  shifts: number;
  energyPriceChange: number;
}

export interface ScenarioResult {
  production: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ScenarioResponse {
  baseline: ScenarioResult;
  scenario: ScenarioResult;
  series: Array<{ month: string; baseline: number; scenario: number }>;
}

export interface Location {
  id: string;
  name: string;
  region: string;
  type: string;
  performance: "Yüksek" | "Orta" | "Düşük";
  value: number;
  trend: string;
  lat: number;
  lng: number;
}

export interface Widget {
  id: string;
  title: string;
  type: "chart" | "pie" | "table" | "bar" | "progress";
  typeLabel: string;
  size: "wide" | "medium" | "narrow";
  sizeLabel: string;
  enabled: boolean;
  order: number;
}

export interface AvailableWidget {
  key: string;
  title: string;
  type: Widget["type"];
  size: Widget["size"];
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  card: string;
  text: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Yönetici" | "Analist" | "Gözlemci";
  status: "Aktif" | "Pasif";
  lastLogin: string;
}

export interface Role {
  name: User["role"];
  description?: string;
  permissions: Record<string, boolean>;
}

export type ReportComponentType = "title" | "text" | "chart" | "table" | "image";

export interface ReportComponent {
  id: string;
  type: ReportComponentType;
  label: string;
  content?: string;
  source?: string;
}

export interface Report {
  id: string;
  name: string;
  reportType: string;
  description: string;
  components: ReportComponent[];
  updatedAt?: string;
}

export interface ScheduledEmail {
  id: string;
  subject: string;
  recipients: string[];
  reports: string[];
  schedule: string;
  lastSent: string;
  status: "Aktif" | "Pasif";
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  connection: string;
  recordCount: string;
  size: string;
  updatedAt: string;
  status: "Bağlı" | "Bağlantı Yok";
  columns?: string[];
  preview?: Array<Array<string | number>>;
}

export interface UploadResult {
  id: string;
  name: string;
  rows: number;
  columns: string[];
  preview: Array<Array<string | number>>;
  summary?: Record<string, unknown>;
}

export interface ChatTable {
  columns: string[];
  rows: Array<Array<string | number>>;
}

export interface ChatChart {
  type: "bar" | "line" | "pie";
  data: Array<Record<string, number | string>>;
  xKey: string;
  yKeys: string[];
}

export interface ChatResponse {
  reply: string;
  table?: ChatTable;
  chart?: ChatChart;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  table?: ChatTable;
  chart?: ChatChart;
  pending?: boolean;
}

export type NotificationLevel = "info" | "warn" | "err" | "ok";

export interface Notification {
  id: string;
  title: string;
  body: string;
  level: NotificationLevel;
  /** ISO timestamp (or a human string if the backend sends one) */
  time: string;
  read: boolean;
  href?: string;
}

export interface LiveLine {
  name: string;
  oee: number;
  rate: number;
  temp?: number;
  status?: string;
}

export interface LiveData {
  ts: string;
  lines: LiveLine[];
  plant: { energyKw: number; activeStaff: number; openAlerts: number };
}
