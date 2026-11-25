"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OfflineState {
  offline: boolean;
  lastChecked: number;
  setOffline: () => void;
  setOnline: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  offline: false,
  lastChecked: 0,
  setOffline: () => set({ offline: true, lastChecked: Date.now() }),
  setOnline: () => set({ offline: false, lastChecked: Date.now() }),
}));

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  /** Sidebar groups the user has folded shut (by title). Groups default open. */
  closedGroups: string[];
  toggleGroup: (title: string) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (v) => set({ collapsed: v }),
      mobileOpen: false,
      setMobileOpen: (v) => set({ mobileOpen: v }),
      paletteOpen: false,
      setPaletteOpen: (v) => set({ paletteOpen: v }),
      closedGroups: [],
      toggleGroup: (title) =>
        set((s) => ({ closedGroups: s.closedGroups.includes(title) ? s.closedGroups.filter((t) => t !== title) : [...s.closedGroups, title] })),
    }),
    { name: "vespera:sidebar", partialize: (s) => ({ collapsed: s.collapsed, closedGroups: s.closedGroups }) },
  ),
);
