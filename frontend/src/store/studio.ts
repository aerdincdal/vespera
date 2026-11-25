"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Widget } from "@/lib/types";

export type StudioChartType = "line" | "area" | "bar" | "hbar" | "pie" | "scatter" | "heatmap";
export type StudioAgg = "sum" | "avg" | "count";

export interface StudioConfig {
  source: string; // "analytics:uretim" | "module:stok:0"
  chartType: StudioChartType;
  xKey: string;
  yKeys: string[];
  agg: StudioAgg;
  paletteStart: number;
  grid: boolean;
  legend: boolean;
  labels: boolean;
  smooth: boolean;
  title: string;
  subtitle: string;
}

/** Widgets created in the Görselleştirme Stüdyosu; layered over the API/mock widget list on Kişisel Dashboard. */
export interface StudioWidget extends Widget {
  studio: StudioConfig;
  /** materialised rows so the widget renders offline without re-querying */
  data: Array<Record<string, number | string>>;
}

interface StudioState {
  widgets: StudioWidget[];
  add: (w: StudioWidget) => void;
  remove: (id: string) => void;
}

export const useStudioWidgets = create<StudioState>()(
  persist(
    (set) => ({
      widgets: [],
      add: (w) => set((s) => ({ widgets: [...s.widgets.filter((x) => x.id !== w.id), w] })),
      remove: (id) => set((s) => ({ widgets: s.widgets.filter((x) => x.id !== id) })),
    }),
    { name: "vespera:studio-widgets" },
  ),
);
