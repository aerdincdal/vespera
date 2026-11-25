"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SERIES, toneColor } from "@/components/vespera/tone";
import { ChartLegend, GlassTooltip } from "./theme";

export function DonutChart({
  data,
  height = 240,
  centerLabel,
  centerValue,
  unit = "",
  legend = "right",
}: {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  unit?: string;
  legend?: "right" | "bottom" | "none";
}) {
  const reduce = useReducedMotion();
  const colored = data.map((d, i) => ({ ...d, fill: toneColor(d.color, i) || SERIES[i % SERIES.length] }));
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className={legend === "right" ? "flex flex-col items-center gap-4 sm:flex-row" : "flex flex-col gap-4"}>
      <div className="relative shrink-0" style={{ height, width: legend === "right" ? height : "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<GlassTooltip valueFormatter={(v) => `${v}${unit}`} />} />
            <Pie
              data={colored}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="var(--navy-900)"
              strokeWidth={2}
              isAnimationActive={!reduce}
              animationDuration={800}
            >
              {colored.map((d) => <Cell key={d.name} fill={d.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="tnum font-serif text-[24px] font-medium leading-none text-sand-50">{centerValue ?? Math.round(total / data.length)}</span>
          <span className="mt-1 text-[10.5px] uppercase tracking-[0.08em] text-ink-muted">{centerLabel ?? "ortalama"}</span>
        </div>
      </div>
      {legend !== "none" && (
        <ChartLegend
          className={legend === "right" ? "flex-col items-start gap-y-2.5" : ""}
          items={colored.map((d) => ({ name: d.name, color: d.fill, value: `${d.value}${unit}` }))}
        />
      )}
    </div>
  );
}
