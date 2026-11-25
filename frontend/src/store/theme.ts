"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeColors } from "@/lib/types";

export const DEFAULT_THEME: ThemeColors = {
  primary: "#c4b28d",
  secondary: "#d9cbae",
  accent: "#c8875a",
  success: "#7fb28a",
  warning: "#d9b86a",
  error: "#c96b6b",
  background: "#0b1528",
  card: "#172b4d",
  text: "#f6f1e7",
};

export const THEME_PRESETS: Array<{ id: string; name: string; colors: ThemeColors }> = [
  { id: "vespera", name: "Vespera (Lacivert + Bej)", colors: DEFAULT_THEME },
  {
    id: "gece", name: "Gece Mavisi",
    colors: { ...DEFAULT_THEME, primary: "#7f9fcf", secondary: "#a9bfe0", accent: "#c4b28d", background: "#070e1c", card: "#10203a" },
  },
  {
    id: "bakir", name: "Bakır Akşamı",
    colors: { ...DEFAULT_THEME, primary: "#c8875a", secondary: "#e0aa82", accent: "#c4b28d", background: "#0f1220", card: "#1c2233" },
  },
];

export const THEME_SCHEMES: Array<{ id: string; name: string; primary: string; secondary: string }> = [
  { id: "bej", name: "Bej", primary: "#c4b28d", secondary: "#d9cbae" },
  { id: "adacayi", name: "Adaçayı", primary: "#8fa98a", secondary: "#b3c6ae" },
  { id: "lavanta", name: "Lavanta", primary: "#9b8fbf", secondary: "#bcb2d6" },
  { id: "gul", name: "Gül", primary: "#b8707a", secondary: "#d09aa1" },
];

const VAR_MAP: Record<keyof ThemeColors, string[]> = {
  primary: ["--sand-300", "--primary", "--series-1"],
  secondary: ["--sand-200"],
  accent: ["--copper", "--series-3"],
  success: ["--ok"],
  warning: ["--warn"],
  error: ["--err", "--destructive"],
  background: ["--navy-900", "--background"],
  card: ["--navy-700", "--card"],
  text: ["--sand-50", "--foreground"],
};

export function applyThemeToDocument(colors: ThemeColors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  (Object.keys(VAR_MAP) as Array<keyof ThemeColors>).forEach((k) => {
    VAR_MAP[k].forEach((v) => root.style.setProperty(v, colors[k]));
  });
  const rgb = hexToRgb(colors.primary);
  if (rgb) {
    root.style.setProperty("--line", `rgba(${rgb.r},${rgb.g},${rgb.b},0.14)`);
    root.style.setProperty("--line-strong", `rgba(${rgb.r},${rgb.g},${rgb.b},0.28)`);
    root.style.setProperty("--ring", `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`);
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

interface ThemeState {
  colors: ThemeColors;
  setColor: (key: keyof ThemeColors, value: string) => void;
  setColors: (c: ThemeColors) => void;
  reset: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colors: DEFAULT_THEME,
      setColor: (key, value) => set((s) => ({ colors: { ...s.colors, [key]: value } })),
      setColors: (colors) => set({ colors }),
      reset: () => set({ colors: DEFAULT_THEME }),
    }),
    { name: "vespera:theme" },
  ),
);
