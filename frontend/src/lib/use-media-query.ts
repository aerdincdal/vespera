"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook. The server snapshot is `false`, so markup rendered
 * for static export always matches the desktop branch until the client hydrates.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener?.("change", notify);
      return () => mq.removeEventListener?.("change", notify);
    },
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** Phones (Tailwind < sm). */
export const usePhone = () => useMediaQuery("(max-width: 639px)");
