"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SERIES } from "@/components/vespera/tone";
import { AXIS_TICK, ChartLegend, CURSOR, GlassTooltip, GRID } from "./theme";
import { ChartFrame } from "./chart-frame";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export function LinesChart({
  data,
  xKey,
  yKeys,
  title,
  caption,
  height = 280,
  domain,
  unit = "",
  colors,
}: {
  data: Array<Record<string, number | string>>;
  xKey: string;
  yKeys: string[];
  title?: string;
  caption?: string;
  height?: number;
  domain?: [number, number];
  unit?: string;
  colors?: string[];
}) {
  const palette = colors ?? SERIES;
  const reduce = useReducedMotion();
  // Short units ("%", "₺") ride on every tick; longer ones ("bin adet", "kWh")
  // would be clipped by the axis gutter, so they become a small caption instead.
  const inlineUnit = unit.trim().length <= 2 ? unit : "";
  const unitCaption = inlineUnit ? undefined : unit.trim() || undefined;
  const fmtTick = (v: unknown) => `${typeof v === "number" ? v.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : String(v ?? "")}${inlineUnit}`;
  const [active, setActive] = useState<Record<string, boolean>>({});
  const toggle = (n: string) => setActive((a) => ({ ...a, [n]: a[n] === false ? true : false }));
  return (
    <ChartFrame
      title={title}
      caption={caption ?? (unitCaption ? `Birim: ${unitCaption}` : undefined)}
      height={height}
      legend={
        yKeys.length > 1 ? (
          <ChartLegend items={yKeys.map((k, i) => ({ name: k, color: palette[i % palette.length] }))} active={active} onToggle={toggle} />
        ) : undefined
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="0" />
          <XAxis dataKey={xKey} tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" dy={6} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} domain={domain ?? ["auto", "auto"]} width={48} tickCount={5} tickFormatter={fmtTick} />
          <Tooltip cursor={CURSOR} content={<GlassTooltip valueFormatter={(v) => `${v.toLocaleString("tr-TR")}${inlineUnit || (unit ? ` ${unit.trim()}` : "")}`} />} />
          {yKeys.map((k, i) => {
            // Confidence bands ("Alt Bant" / "Üst Bant") read as thin dashed guides, not as data series.
            const band = /bant|band|min\.?$|maks?\.?$/i.test(k);
            return (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              connectNulls={false}
              stroke={palette[i % palette.length]}
              strokeWidth={band ? 1.25 : 2}
              strokeDasharray={band ? "4 4" : undefined}
              strokeOpacity={band ? 0.8 : 1}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--navy-900)" }}
              hide={active[k] === false}
              isAnimationActive={!reduce}
              animationDuration={700}
            />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
