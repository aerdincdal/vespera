"use client";

import { useId, useState } from "react";
import { Area, AreaChart as RArea, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SERIES } from "@/components/vespera/tone";
import { AXIS_TICK, ChartLegend, CURSOR, GlassTooltip, GRID } from "./theme";
import { ChartFrame } from "./chart-frame";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export function AreaChart({
  data,
  xKey,
  yKeys,
  title,
  caption,
  height = 280,
  unit = "",
  colors,
  formatter,
}: {
  data: Array<Record<string, number | string>>;
  xKey: string;
  yKeys: string[];
  title?: string;
  caption?: string;
  height?: number;
  unit?: string;
  colors?: string[];
  formatter?: (v: number) => string;
}) {
  const palette = colors ?? SERIES;
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const [active, setActive] = useState<Record<string, boolean>>({});
  const toggle = (n: string) => setActive((a) => ({ ...a, [n]: a[n] === false ? true : false }));
  const fmt = formatter ?? ((v: number) => `${v.toLocaleString("tr-TR")}${unit}`);
  return (
    <ChartFrame
      title={title}
      caption={caption}
      height={height}
      legend={yKeys.length > 1 ? <ChartLegend items={yKeys.map((k, i) => ({ name: k, color: palette[i % palette.length] }))} active={active} onToggle={toggle} /> : undefined}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RArea data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <defs>
            {yKeys.map((k, i) => (
              <linearGradient key={k} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette[i % palette.length]} stopOpacity={0.28} />
                <stop offset="100%" stopColor={palette[i % palette.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" dy={6} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={52} tickCount={5} tickFormatter={(v) => fmt(Number(v ?? 0))} />
          <Tooltip cursor={CURSOR} content={<GlassTooltip valueFormatter={(v) => fmt(v)} />} />
          {yKeys.map((k, i) => (
            <Area connectNulls={false}
              key={k}
              type="monotone"
              dataKey={k}
              stroke={palette[i % palette.length]}
              strokeWidth={2}
              fill={`url(#${id}-${i})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--navy-900)" }}
              hide={active[k] === false}
              isAnimationActive={!reduce}
              animationDuration={700}
            />
          ))}
        </RArea>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
