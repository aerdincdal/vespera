"use client";

import { useMemo, useState } from "react";
import {
  Area, AreaChart as RArea, Bar, BarChart as RBar, CartesianGrid, LabelList, Line, LineChart as RLine, ResponsiveContainer,
  Scatter, ScatterChart as RScatter, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { SERIES } from "@/components/vespera/tone";
import { AXIS_TICK, ChartLegend, CURSOR, GlassTooltip, GRID } from "./theme";
import { ChartFrame } from "./chart-frame";
import { DonutChart } from "./donut-chart";
import { Heatmap } from "./heatmap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { StudioAgg, StudioConfig } from "@/store/studio";

export type Row = Record<string, number | string>;

const num = (v: unknown) => (typeof v === "number" ? v : Number(v));

/** Group by xKey and aggregate each yKey. */
export function aggregateRows(rows: Row[], xKey: string, yKeys: string[], agg: StudioAgg): Row[] {
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = String(r[xKey] ?? "—");
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  return [...groups.entries()].map(([k, list]) => {
    const out: Row = { [xKey]: k };
    for (const y of yKeys) {
      const vals = list.map((r) => num(r[y])).filter((v) => Number.isFinite(v));
      out[y] = agg === "count" ? vals.length : agg === "avg" ? (vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0) : Math.round(vals.reduce((a, b) => a + b, 0) * 100) / 100;
    }
    return out;
  });
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  const d = Math.sqrt(da * db);
  return d ? Math.max(-1, Math.min(1, num / d)) : 0;
}

const fmt = (v: number) => v.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

export function StudioChart({ config, rows, height = 360 }: { config: StudioConfig; rows: Row[]; height?: number }) {
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const toggle = (n: string) => setHidden((h) => ({ ...h, [n]: h[n] === false ? true : false }));
  const palette = useMemo(() => [...SERIES.slice(config.paletteStart), ...SERIES.slice(0, config.paletteStart)], [config.paletteStart]);
  const yKeys = config.yKeys;
  const data = useMemo(() => aggregateRows(rows, config.xKey, yKeys, config.agg), [rows, config.xKey, yKeys, config.agg]);
  const legend = config.legend && yKeys.length > 1 ? <ChartLegend items={yKeys.map((k, i) => ({ name: k, color: palette[i % palette.length] }))} active={hidden} onToggle={toggle} /> : undefined;
  const curve = config.smooth ? "monotone" : "linear";
  const anim = { isAnimationActive: !reduce, animationDuration: 600 } as const;

  if (!yKeys.length || !config.xKey) {
    return <div className="flex items-center justify-center text-[13px] text-ink-muted" style={{ height }}>Bir X alanı ve en az bir Y alanı seçin.</div>;
  }

  if (config.chartType === "pie") {
    const k = yKeys[0];
    return <DonutChart height={height} legend="right" data={data.map((d, i) => ({ name: String(d[config.xKey]), value: num(d[k]), color: palette[i % palette.length] }))} centerLabel={k} centerValue={fmt(data.reduce((a, d) => a + num(d[k]), 0))} />;
  }

  if (config.chartType === "heatmap") {
    const keys = yKeys.length >= 2 ? yKeys : [...yKeys, config.xKey];
    const cols = keys.map((k) => rows.map((r) => num(r[k])).filter((v) => Number.isFinite(v)));
    const matrix = keys.map((_, i) => keys.map((__, j) => (i === j ? 1 : Number(pearson(cols[i], cols[j]).toFixed(2)))));
    return (
      <div style={{ minHeight: height }} className="flex flex-col justify-center">
        <div className="eyebrow mb-3">Korelasyon matrisi (Pearson)</div>
        <Heatmap labels={keys} matrix={matrix} />
        {yKeys.length < 2 && <p className="mt-3 text-[12px] text-ink-muted">Isı haritası için en az iki sayısal Y alanı seçmeniz önerilir.</p>}
      </div>
    );
  }

  const grid = config.grid ? <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="0" /> : null;
  const tooltip = <Tooltip cursor={CURSOR} content={<GlassTooltip valueFormatter={(v) => fmt(v)} />} />;
  const labelProps = { position: "top" as const, fill: "rgba(246,241,231,0.7)", fontSize: 10.5, formatter: (v: unknown) => fmt(num(v)) };

  if (config.chartType === "scatter") {
    const [xk, ...rest] = yKeys.length >= 2 ? yKeys : [config.xKey, ...yKeys];
    return (
      <ChartFrame height={height} legend={legend} caption={`X: ${xk}`}>
        <ResponsiveContainer width="100%" height="100%">
          <RScatter margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
            {grid}
            <XAxis dataKey={xk} type="number" name={xk} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(num(v))} />
            <YAxis dataKey={rest[0]} type="number" name={rest[0]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => fmt(num(v))} />
            <ZAxis range={[40, 40]} />
            {tooltip}
            {rest.map((k, i) => (
              <Scatter key={k} name={k} data={rows.map((r) => ({ [xk]: num(r[xk]), [k]: num(r[k]) }))} dataKey={k} fill={palette[i % palette.length]} fillOpacity={0.85} hide={hidden[k] === false} {...anim} />
            ))}
          </RScatter>
        </ResponsiveContainer>
      </ChartFrame>
    );
  }

  const horizontal = config.chartType === "hbar";
  const axes = horizontal ? (
    <>
      <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(num(v))} />
      <YAxis type="category" dataKey={config.xKey} tick={AXIS_TICK} tickLine={false} axisLine={false} width={120} />
    </>
  ) : (
    <>
      <XAxis dataKey={config.xKey} tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" dy={6} />
      <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} tickCount={5} tickFormatter={(v) => fmt(num(v))} />
    </>
  );
  const margin = { top: 12, right: 16, bottom: 0, left: horizontal ? 0 : -8 };

  return (
    <ChartFrame height={height} legend={legend}>
      <ResponsiveContainer width="100%" height="100%">
        {config.chartType === "line" ? (
          <RLine data={data} margin={margin}>
            {grid}{axes}{tooltip}
            {yKeys.map((k, i) => (
              <Line key={k} type={curve} dataKey={k} stroke={palette[i % palette.length]} strokeWidth={2} dot={config.labels} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--navy-900)" }} hide={hidden[k] === false} {...anim}>
                {config.labels && <LabelList dataKey={k} {...labelProps} />}
              </Line>
            ))}
          </RLine>
        ) : config.chartType === "area" ? (
          <RArea data={data} margin={margin}>
            <defs>
              {yKeys.map((k, i) => (
                <linearGradient key={k} id={`studio-g-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette[i % palette.length]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={palette[i % palette.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {grid}{axes}{tooltip}
            {yKeys.map((k, i) => (
              <Area key={k} type={curve} dataKey={k} stroke={palette[i % palette.length]} strokeWidth={2} fill={`url(#studio-g-${i})`} dot={false} hide={hidden[k] === false} {...anim}>
                {config.labels && <LabelList dataKey={k} {...labelProps} />}
              </Area>
            ))}
          </RArea>
        ) : (
          <RBar data={data} margin={margin} layout={horizontal ? "vertical" : "horizontal"} barCategoryGap="28%">
            {grid}{axes}{tooltip}
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={palette[i % palette.length]} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} hide={hidden[k] === false} {...anim}>
                {config.labels && <LabelList dataKey={k} {...labelProps} position={horizontal ? "right" : "top"} />}
              </Bar>
            ))}
          </RBar>
        )}
      </ResponsiveContainer>
    </ChartFrame>
  );
}
