import type { ScenarioInput, ScenarioResponse, ScenarioResult } from "../types";

export const SCENARIO_BASE: ScenarioInput = { demandChange: 0, materialPriceChange: 0, shifts: 2, energyPriceChange: 0 };
export const SCENARIO_PRESETS: Array<{ id: string; name: string; input: ScenarioInput }> = [
  { id: "iyimser", name: "İyimser", input: { demandChange: 15, materialPriceChange: -5, shifts: 3, energyPriceChange: -3 } },
  { id: "baz", name: "Baz", input: SCENARIO_BASE },
  { id: "kotumser", name: "Kötümser", input: { demandChange: -12, materialPriceChange: 12, shifts: 2, energyPriceChange: 18 } },
];

const BASE: ScenarioResult = { production: 17450, revenue: 3_200_000, cost: 1_950_000, profit: 1_250_000 };

export function computeScenario(input: ScenarioInput): ScenarioResponse {
  const demand = 1 + input.demandChange / 100;
  const capacity = Math.min(1.5, input.shifts / SCENARIO_BASE.shifts);
  const production = Math.round(BASE.production * Math.min(demand, capacity));
  const revenue = Math.round(BASE.revenue * (production / BASE.production));
  const materialShare = 0.55, energyShare = 0.15, laborShare = 0.3;
  const costFactor =
    materialShare * (1 + input.materialPriceChange / 100) * (production / BASE.production)
    + energyShare * (1 + input.energyPriceChange / 100) * (production / BASE.production)
    + laborShare * (input.shifts / SCENARIO_BASE.shifts);
  const cost = Math.round(BASE.cost * costFactor);
  const profit = revenue - cost;
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const series = months.map((month, i) => {
    const ramp = 0.9 + (i / 11) * 0.25;
    return {
      month,
      baseline: Math.round(BASE.profit * ramp),
      scenario: Math.round(profit * ramp * (1 + Math.sin(i / 2) * 0.03)),
    };
  });
  return { baseline: BASE, scenario: { production, revenue, cost, profit }, series };
}
