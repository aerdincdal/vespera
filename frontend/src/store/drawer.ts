"use client";

import { create } from "zustand";
import type { Kpi, ModuleData, Tool } from "@/lib/types";

export type DrawerPayload =
  | { kind: "tool"; module: ModuleData; tool: Tool }
  | { kind: "kpi"; kpi: Kpi; context?: string; slug?: string }
  | { kind: "row"; title: string; columns: string[]; values: Array<string | number>; slug?: string; context?: string }
  | { kind: "indicator"; label: string; value: number; color?: string; context?: string };

interface DrawerState {
  payload: DrawerPayload | null;
  open: (p: DrawerPayload) => void;
  close: () => void;
}

export const useDrawerStore = create<DrawerState>((set) => ({
  payload: null,
  open: (payload) => set({ payload }),
  close: () => set({ payload: null }),
}));

export const openDrawer = (p: DrawerPayload) => useDrawerStore.getState().open(p);
