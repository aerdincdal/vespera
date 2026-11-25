"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Source = "api" | "mock";

function resolveMock<T>(m: T | (() => T)): T | undefined {
  try {
    return typeof m === "function" ? (m as () => T)() : m;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("[VESPERA] mock üretilemedi:", e);
    return undefined;
  }
}

interface Result<T> {
  key: string;
  data: T | undefined;
  error: Error | null;
  source: Source;
}

/**
 * Fetch from the backend; on any failure fall back to the mock so the UI
 * always renders fully. `key` re-runs the fetch when it changes.
 * `loading` is derived (result.key !== key) so no state is set synchronously in effects.
 */
export function useApi<T>(fetcher: () => Promise<T>, mock: T | (() => T), key: string = "") {
  const [result, setResult] = useState<Result<T>>({ key: "\u0000init", data: undefined, error: null, source: "api" });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  const mockRef = useRef(mock);

  useEffect(() => {
    fetcherRef.current = fetcher;
    mockRef.current = mock;
  });

  useEffect(() => {
    let cancelled = false;
    // Promise.resolve().then(...) also captures synchronous throws from the fetcher
    // and from adapters (which run inside the fetcher's .then chain), so any
    // unexpected backend shape degrades to the mock instead of crashing the tree.
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: null, source: "api" });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (process.env.NODE_ENV !== "production" && !(e instanceof Error && e.name === "DemoModeError")) console.warn("[VESPERA] API → mock fallback:", key || "(root)", e);
        const data = resolveMock(mockRef.current);
        setResult({ key, data, error: e instanceof Error ? e : new Error(String(e)), source: "mock" });
      });
    return () => {
      cancelled = true;
    };
  }, [key, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  const setData = useCallback((d: T | ((prev: T | undefined) => T)) => {
    setResult((s) => ({ ...s, data: typeof d === "function" ? (d as (p: T | undefined) => T)(s.data) : d }));
  }, []);

  const loading = result.key !== key;
  return { data: result.data, error: result.error, source: result.source, loading, refetch, setData };
}

/** Run a mutation against the API; if it fails, apply the optimistic fallback locally. */
export async function tryApi<T>(call: () => Promise<T>, fallback: () => T): Promise<{ result: T; source: Source }> {
  try {
    return { result: await call(), source: "api" };
  } catch {
    return { result: fallback(), source: "mock" };
  }
}

export function newId(prefix = "local"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
