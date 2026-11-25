"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WidgetOrderState {
  order: string[];
  setOrder: (ids: string[]) => void;
}

/** Client-side widget order (persisted) — layered over the API list so DnD survives reloads even offline. */
export const useWidgetOrder = create<WidgetOrderState>()(
  persist((set) => ({ order: [], setOrder: (order) => set({ order }) }), { name: "vespera:widget-order" }),
);
