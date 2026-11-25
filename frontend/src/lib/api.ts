"use client";

import type { DataSource, Report, ScenarioInput, ScheduledEmail, ThemeColors, User, Widget } from "./types";
import { useOfflineStore } from "@/store/ui";
import { DEFAULT_THEME } from "@/store/theme";
import {
  adaptAnalytics, adaptAvailableWidgets, adaptChat, adaptDashboard, adaptDatasets, adaptDataSource, adaptLocations,
  adaptModule, adaptReport, adaptRoles, adaptScenario, adaptTheme, adaptUpload, adaptWidget, themeToBackend,
  adaptLive, adaptNotifications,
} from "./adapt";

type Raw = Record<string, unknown>;
const TYPE_KEYS: Record<string, string> = {
  "Veritabanı": "database", "Excel Dosyası": "excel", "CSV Dosyası": "csv", "API / Web Servisi": "api", "Dosya Yükleme": "upload",
};

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").trim();
/** Demo mode: an empty NEXT_PUBLIC_API_URL means "no backend" — never touch the network, resolve with mocks. */
export const IS_DEMO = API_URL === "";

export class DemoModeError extends Error {
  constructor() {
    super("Demo modu: backend bağlantısı devre dışı");
    this.name = "DemoModeError";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 6000): Promise<T> {
  if (IS_DEMO) throw new DemoModeError();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: init?.body instanceof FormData
        ? init?.headers
        : { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`);
    useOfflineStore.getState().setOnline();
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  } catch (e) {
    if (!(e instanceof ApiError)) useOfflineStore.getState().setOffline();
    throw e;
  } finally {
    clearTimeout(t);
  }
}

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const api = {
  health: () => request<{ status: string }>("/api/health"),
  dashboard: () => request<Raw>("/api/dashboard").then(adaptDashboard),
  module: (slug: string) => request<Raw>(`/api/modules/${slug}`).then((r) => adaptModule(r, slug)),

  datasets: () => request<unknown>("/api/analytics/datasets").then(adaptDatasets),
  analytics: (dataset: string, q: { from?: string; to?: string; groupBy?: string }) => {
    const params = new URLSearchParams();
    if (q.from) params.set("from", q.from);
    if (q.to) params.set("to", q.to);
    if (q.groupBy) params.set("groupBy", q.groupBy);
    return request<Raw>(`/api/analytics/${dataset}?${params}`).then(adaptAnalytics);
  },

  scenario: (input: ScenarioInput) => request<Raw>("/api/scenario", json(input)).then(adaptScenario),
  locations: () => request<unknown>("/api/locations").then(adaptLocations),

  widgets: () => request<Raw[]>("/api/widgets").then((l) => l.map(adaptWidget)),
  widgetsAvailable: () => request<unknown>("/api/widgets/available").then(adaptAvailableWidgets),
  widgetAdd: (w: Partial<Widget> & { key?: string }) => request<Raw>("/api/widgets", json(w)).then(adaptWidget),
  widgetPatch: (id: string, patch: Partial<Widget>) => request<Raw>(`/api/widgets/${id}`, { method: "PATCH", body: JSON.stringify({ ...patch, typeKey: patch.type, sizeKey: patch.size, type: undefined, size: undefined }) }).then(adaptWidget),
  widgetDelete: (id: string) => request<void>(`/api/widgets/${id}`, { method: "DELETE" }),

  theme: () => request<Raw>("/api/theme").then((r) => adaptTheme(r, DEFAULT_THEME)),
  themePut: (t: ThemeColors) => request<Raw>("/api/theme", { method: "PUT", body: JSON.stringify(themeToBackend(t)) }).then((r) => adaptTheme(r, t)),

  users: () => request<User[]>("/api/users"),
  userAdd: (u: Omit<User, "id">) => request<User>("/api/users", json(u)),
  userPatch: (id: string, patch: Partial<User>) => request<User>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  userDelete: (id: string) => request<void>(`/api/users/${id}`, { method: "DELETE" }),
  roles: () => request<unknown>("/api/roles").then(adaptRoles),

  reports: () => request<Raw[]>("/api/reports").then((l) => l.map(adaptReport)),
  reportCreate: (r: Omit<Report, "id">) => request<Raw>("/api/reports", json({ ...r, type: r.reportType })).then(adaptReport),
  reportPut: (id: string, r: Report) => request<Raw>(`/api/reports/${id}`, { method: "PUT", body: JSON.stringify({ ...r, type: r.reportType }) }).then(adaptReport),
  reportDelete: (id: string) => request<void>(`/api/reports/${id}`, { method: "DELETE" }),
  reportPdf: async (id: string, report?: Report): Promise<Blob> => {
    if (IS_DEMO) throw new DemoModeError();
    const res = await fetch(`${API_URL}/api/reports/${id}/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: report ? JSON.stringify(report) : undefined,
    });
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res.blob();
  },

  emails: () => request<ScheduledEmail[]>("/api/emails"),
  emailCreate: (e: Omit<ScheduledEmail, "id">) => request<ScheduledEmail>("/api/emails", json(e)),
  emailPatch: (id: string, patch: Partial<ScheduledEmail>) => request<ScheduledEmail>(`/api/emails/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  emailDelete: (id: string) => request<void>(`/api/emails/${id}`, { method: "DELETE" }),
  emailSend: (id: string) => request<{ simulated?: boolean; sent?: boolean; message?: string }>(`/api/emails/${id}/send`, { method: "POST" }),

  datasources: () => request<Raw[]>("/api/datasources").then((l) => l.map(adaptDataSource)),
  datasourceCreate: (d: Partial<DataSource>) =>
    request<Raw>("/api/datasources", json({ name: d.name, typeKey: TYPE_KEYS[d.type ?? ""] ?? "database", connection: d.connection ?? "", status: d.status })).then(adaptDataSource),
  datasourceDelete: (id: string) => request<void>(`/api/datasources/${id}`, { method: "DELETE" }),
  datasourceSync: (id: string) => request<Raw>(`/api/datasources/${id}/sync`, { method: "POST" }).then((r) => adaptDataSource((r.datasource as Raw) ?? r)),
  upload: (file: File, name?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (name) fd.append("name", name);
    return request<Raw>("/api/datasources/upload", { method: "POST", body: fd }, 30000).then(adaptUpload);
  },

  notifications: () => request<unknown>("/api/notifications").then(adaptNotifications),
  notificationRead: (id: string) => request<unknown>(`/api/notifications/${id}/read`, { method: "POST" }),
  notificationsReadAll: () => request<unknown>("/api/notifications/read-all", { method: "POST" }),
  /** short timeout: polled every 3s, a slow answer is worse than a mock tick */
  live: () => request<Raw>("/api/live", undefined, 2500).then(adaptLive),

  chat: (body: { message: string; history: Array<{ role: string; content: string }>; datasourceId?: string }) =>
    request<Raw>("/api/chat", json(body), 60000).then(adaptChat),
};
