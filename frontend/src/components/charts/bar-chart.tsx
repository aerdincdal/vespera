"use client";

import { useState } from "react";
import { Bar, BarChart as RBar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { SERIES } from "@/components/vespera/tone";
import { AXIS_TICK, ChartLegend, GlassTooltip, GRID } from "./theme";
import { ChartFrame } from "./chart-frame";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export function BarChart({
  data,
  xKey,
  yKeys,
  title,
  caption,
  height = 280,
  unit = "",
  colors,
  horizontal = false,
  colorByCategory = false,
}: {
  data: Array<Record<string, number | string>>;
  xKey: string;
  yKeys: string[];
  title?: string;
  caption?: string;
  height?: number;
  unit?: string;
  colors?: string[];
  horizontal?: boolean;
  colorByCategory?: boolean;
}) {
  const palette = colors ?? SERIES;
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Record<string, boolean>>({});
  const toggle = (n: string) => setActive((a) => ({ ...a, [n]: a[n] === false ? true : false }));
  const fmt = (v: number) => `${v.toLocaleString("tr-TR")}${unit}`;
  return (
    <ChartFrame
      title={title}
      caption={caption}
      height={height}
      legend={yKeys.length > 1 ? <ChartLegend items={yKeys.map((k, i) => ({ name: k, color: palette[i % palette.length] }))} active={active} onToggle={toggle} /> : undefined}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RBar data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, bottom: 0, left: horizontal ? 8 : -8 }} barCategoryGap="28%" barGap={2}>
          <CartesianGrid stroke={GRID} vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(Number(v ?? 0))} />
              <YAxis type="category" dataKey={xKey} tick={AXIS_TICK} tickLine={false} axisLine={false} width={110} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={AXIS_TICK} tickLine={false} axisLine={false} dy={6} interval={0} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={52} tickCount={5} tickFormatter={(v) => fmt(Number(v ?? 0))} />
            </>
          )}
          <Tooltip cursor={{ fill: "rgba(196,178,141,0.06)" }} content={<GlassTooltip valueFormatter={(v) => fmt(v)} />} />
          {yKeys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={palette[i % palette.length]} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={38} hide={active[k] === false} isAnimationActive={!reduce} animationDuration={700}>
              {colorByCategory && data.map((_, di) => <Cell key={di} fill={palette[di % palette.length]} />)}
            </Bar>
          ))}
        </RBar>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
