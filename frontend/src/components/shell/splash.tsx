"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const KEY = "vespera:splash-seen";
const DRAW_MS = 900;
const TOTAL_MS = 1600;
const FADE_MS = 350;
const REDUCED_MS = 300;

type Phase = "in" | "out" | "hidden";
interface Decision { show: boolean; reduced: boolean }

// Decided once per page load, on the client only. The server snapshot is always
// "don't show", so SSR output and the first client render agree (no hydration
// mismatch); React then re-renders with the client snapshot after hydration.
let decision: Decision | null = null;
const SERVER_DECISION: Decision = { show: false, reduced: false };
const subscribeNoop = () => () => {};
function getDecision(): Decision {
  if (decision) return decision;
  let seen = true;
  try {
    seen = sessionStorage.getItem(KEY) === "1";
    if (!seen) sessionStorage.setItem(KEY, "1");
  } catch {
    seen = true; // storage blocked → never show, never block
  }
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  decision = { show: !seen, reduced };
  return decision;
}

/**
 * First-visit-per-session intro. Renders nothing on the server, decides on the
 * client, and unmounts completely after the fade so it can't intercept pointer events.
 */
export function Splash() {
  const { show, reduced } = useSyncExternalStore(subscribeNoop, getDecision, () => SERVER_DECISION);
  const [phase, setPhase] = useState<Phase>("in");

  useEffect(() => {
    if (!show || phase !== "in") return;
    const t = setTimeout(() => setPhase(reduced ? "hidden" : "out"), reduced ? REDUCED_MS : TOTAL_MS);
    return () => clearTimeout(t);
  }, [show, phase, reduced]);

  useEffect(() => {
    if (!show || phase !== "out") return;
    const t = setTimeout(() => setPhase("hidden"), FADE_MS);
    return () => clearTimeout(t);
  }, [show, phase]);

  if (!show) return null;
  if (phase === "hidden") return null;

  return (
    <div
      role="status"
      aria-label="VESPERA yükleniyor"
      data-phase={phase}
      data-reduced={reduced ? "1" : undefined}
      className="vs-splash"
      style={{ "--splash-draw": `${DRAW_MS}ms`, "--splash-total": `${TOTAL_MS}ms`, "--splash-fade": `${FADE_MS}ms` } as React.CSSProperties}
    >
      <div className="vs-splash-inner">
        <svg width="96" height="96" viewBox="0 0 32 32" fill="none" aria-hidden className="vs-splash-mark">
          <circle cx="16" cy="16" r="15" stroke="currentColor" strokeOpacity="0.28" strokeWidth="0.8" pathLength={100} style={{ "--d": "0ms" } as React.CSSProperties} />
          <path d="M8 9.5 L14.6 23.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" pathLength={100} style={{ "--d": "80ms" } as React.CSSProperties} />
          <path d="M14.6 23.5 L17.4 17.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" pathLength={100} style={{ "--d": "300ms" } as React.CSSProperties} />
          <path d="M19.2 20 V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" pathLength={100} style={{ "--d": "380ms" } as React.CSSProperties} />
          <path d="M22 20 V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" pathLength={100} style={{ "--d": "460ms" } as React.CSSProperties} />
          <path d="M24.8 20 V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" pathLength={100} style={{ "--d": "540ms" } as React.CSSProperties} />
          <path d="M18 22.5 H26" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" pathLength={100} style={{ "--d": "640ms" } as React.CSSProperties} />
        </svg>
        <div className="vs-splash-word">VESPERA</div>
        <div className="vs-splash-sub">Fabrika Zekâ Platformu · App On Inc.</div>
      </div>
      <span aria-hidden className="vs-splash-bar" />
    </div>
  );
}
