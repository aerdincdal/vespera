"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Flame, Users, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { liveMock, liveRandomWalk } from "@/lib/mock";
import type { LiveData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const INTERVAL = 3000;

function useLive() {
  const [data, setData] = useState<LiveData | null>(null);
  const [source, setSource] = useState<"api" | "mock">("api");
  const prev = useRef<LiveData>(liveMock);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        const d = await api.live();
        if (cancelled) return;
        prev.current = d;
        setData(d);
        setSource("api");
      } catch {
        if (cancelled) return;
        const d = liveRandomWalk(prev.current);
        prev.current = d;
        setData(d);
        setSource("mock");
      }
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === "hidden") return; // resume on visibilitychange
      timer = setTimeout(tick, INTERVAL);
    };
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
      else clearTimeout(timer);
    };

    void tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return { data, source };
}

/** Tabular number whose change triggers a subtle sand flash; fixed width so nothing shifts. */
function Tick({ value, digits = 0, width, className }: { value: number; digits?: number; width: string; className?: string }) {
  const [flash, setFlash] = useState(false);
  const last = useRef(value);
  useEffect(() => {
    if (last.current === value) return;
    last.current = value;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <span className={cn("tnum inline-block text-right tabular-nums transition-colors duration-500", flash ? "text-sand-200" : "text-sand-50", className)} style={{ minWidth: width }}>
      {value.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}
    </span>
  );
}

export function LiveStrip({ className }: { className?: string }) {
  const { data, source } = useLive();
  const lines = (data ?? liveMock).lines.slice(0, 4);
  const plant = (data ?? liveMock).plant;

  return (
    <section
      aria-label="Canlı fabrika verisi"
      className={cn(
        "glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-4 py-2.5 text-[12.5px]",
        !data && "opacity-70",
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex items-center gap-2" />}>
          <span className="relative flex h-2 w-2">
            <span aria-hidden className="vs-pulse absolute inline-flex h-full w-full rounded-full bg-sand-300 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sand-300" />
          </span>
          <span className="eyebrow !text-sand-200/80">Canlı</span>
        </TooltipTrigger>
        <TooltipContent>{source === "api" ? "Backend akışı, 3 sn'de bir yenilenir" : "Backend erişilemedi, simüle akış gösteriliyor"}</TooltipContent>
      </Tooltip>

      <span aria-hidden className="hidden h-4 w-px bg-line sm:block" />

      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {lines.map((l) => (
          <li key={l.name} className="flex items-center gap-2 whitespace-nowrap">
            <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", l.oee >= 85 ? "bg-ok" : l.oee >= 75 ? "bg-warn" : "bg-err")} />
            <span className="text-sand-100/85">{l.name}</span>
            <span className="text-ink-muted">OEE</span>
            <span className="inline-flex items-baseline gap-0.5">
              <Tick value={l.oee} digits={1} width="4.2ch" />
              <span className="text-ink-muted">%</span>
            </span>
            <span className="text-ink-muted/60">·</span>
            <span className="inline-flex items-baseline gap-1">
              <Tick value={l.rate} width="5ch" />
              <span className="text-ink-muted">ad/sa</span>
            </span>
          </li>
        ))}
      </ul>

      <ul className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <li className="flex items-center gap-1.5 whitespace-nowrap">
          <Zap size={13} strokeWidth={1.5} className="text-sand-300" />
          <span className="text-ink-muted">Enerji</span>
          <span className="inline-flex items-baseline gap-1">
            <Tick value={plant.energyKw} width="5.2ch" />
            <span className="text-ink-muted">kW</span>
          </span>
        </li>
        <li className="flex items-center gap-1.5 whitespace-nowrap">
          <Users size={13} strokeWidth={1.5} className="text-steel" />
          <span className="text-ink-muted">Personel</span>
          <Tick value={plant.activeStaff} width="3.4ch" />
        </li>
        <li className="flex items-center gap-1.5 whitespace-nowrap">
          <Flame size={13} strokeWidth={1.5} className={plant.openAlerts > 5 ? "text-err" : "text-copper"} />
          <span className="text-ink-muted">Açık uyarı</span>
          <Tick value={plant.openAlerts} width="2.2ch" />
        </li>
        <li className="hidden items-center gap-1.5 whitespace-nowrap text-ink-muted xl:flex">
          <Activity size={13} strokeWidth={1.5} />
          <span className="tnum">{data ? new Date(data.ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}</span>
        </li>
      </ul>
    </section>
  );
}
