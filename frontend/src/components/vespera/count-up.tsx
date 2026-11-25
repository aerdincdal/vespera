"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const NUM = /^([^\d-]*)(-?[\d.,]+)(.*)$/;

/** Animate a numeric string (keeps prefix/suffix such as "₺", "%", "M", ",") over ~600ms. */
export function CountUp({ value, duration = 600, className }: { value: string | number; duration?: number; className?: string }) {
  const str = String(value);
  const reduce = useReducedMotion();
  const parsed = useMemo(() => {
    const m = NUM.exec(str);
    if (!m) return null;
    const [, prefix, numRaw, suffix] = m;
    const hasThousands = numRaw.includes(",") && !numRaw.includes(".") && numRaw.split(",").every((p, i) => i === 0 || p.length === 3);
    const trThousands = !hasThousands && /^\d{1,3}(\.\d{3})+$/.test(numRaw);
    const normalized = hasThousands ? numRaw.replace(/,/g, "") : trThousands ? numRaw.replace(/\./g, "") : numRaw.replace(",", ".");
    const target = parseFloat(normalized);
    if (Number.isNaN(target)) return null;
    const decimals = (normalized.split(".")[1] ?? "").length;
    return { prefix, suffix, target, decimals, hasThousands, trThousands };
  }, [str]);

  // progress 0..1; a fresh value restarts the animation
  const [anim, setAnim] = useState<{ key: string; t: number }>({ key: str, t: 0 });

  useEffect(() => {
    if (!parsed || reduce) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setAnim({ key: str, t: 1 - Math.pow(1 - t, 3) });
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [str, duration, parsed, reduce]);

  if (!parsed || reduce) return <span className={className}>{str}</span>;
  const t = anim.key === str ? anim.t : 0;
  if (t >= 1) return <span className={className}>{str}</span>;
  const n = parsed.target * t;
  const fixed = n.toFixed(parsed.decimals);
  const out = parsed.hasThousands
    ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: parsed.decimals, maximumFractionDigits: parsed.decimals })
    : parsed.trThousands
      ? Number(fixed).toLocaleString("tr-TR", { maximumFractionDigits: 0 })
      : fixed;
  return <span className={className}>{`${parsed.prefix}${out}${parsed.suffix}`}</span>;
}
