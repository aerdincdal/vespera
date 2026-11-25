import type { AnalyticsResponse, Dataset } from "../types";

export const datasetsMock: Dataset[] = [
  { id: "uretim", label: "Üretim", metrics: ["Üretim Adedi", "OEE", "Duruş Süresi"] },
  { id: "satis", label: "Satış", metrics: ["Satış Hacmi", "Sipariş Sayısı", "Ort. Sepet"] },
  { id: "kalite", label: "Kalite", metrics: ["Uygunluk", "Hata Oranı", "Şikayet Sayısı"] },
  { id: "enerji", label: "Enerji", metrics: ["Tüketim (kWh)", "Su (m³)", "Karbon (t)"] },
];

/** Deterministic pseudo-random so mock renders identically on server and client. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const BASES: Record<string, number[]> = {
  uretim: [1180, 84, 22],
  satis: [3.1, 1720, 1.85],
  kalite: [98.6, 1.4, 12],
  enerji: [8400, 41, 52],
};

export function analyticsMock(dataset: string, groupBy = "day", points?: number): AnalyticsResponse {
  const ds = datasetsMock.find((d) => d.id === dataset) ?? datasetsMock[0];
  const rnd = seeded(ds.id.length * 7919);
  const n = points ?? (groupBy === "month" ? 12 : groupBy === "week" ? 16 : 30);
  const base = BASES[ds.id] ?? [100, 50, 10];
  const series: Array<Record<string, number | string>> = [];
  for (let i = 0; i < n; i++) {
    const label =
      groupBy === "month" ? ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][i % 12]
      : groupBy === "week" ? `H${i + 1}`
      : `${String((i % 30) + 1).padStart(2, "0")} Ağu`;
    const row: Record<string, number | string> = { label };
    ds.metrics.forEach((m, mi) => {
      const trend = 1 + (i / n) * (mi === 1 ? -0.04 : 0.08);
      const noise = 1 + (rnd() - 0.5) * 0.12;
      const v = base[mi] * trend * noise;
      row[m] = Number(v.toFixed(v < 10 ? 2 : 0));
    });
    series.push(row);
  }
  const stats = ds.metrics.map((m) => {
    const vals = series.map((r) => Number(r[m]));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
    const first = vals[0], last = vals[vals.length - 1];
    const pct = ((last - first) / first) * 100;
    return {
      metric: m,
      mean: Number(mean.toFixed(2)),
      min: Math.min(...vals),
      max: Math.max(...vals),
      std: Number(std.toFixed(2)),
      trend: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    };
  });
  const labels = ds.metrics;
  const matrix = labels.map((_, i) =>
    labels.map((__, j) => {
      if (i === j) return 1;
      const r = seeded(i * 31 + j * 17 + ds.id.length)();
      const v = (r - 0.5) * 1.6;
      return Number(Math.max(-0.95, Math.min(0.95, v)).toFixed(2));
    }),
  );
  for (let i = 0; i < labels.length; i++) for (let j = 0; j < i; j++) matrix[i][j] = matrix[j][i];
  return { dataset: ds.id, groupBy, series, metrics: ds.metrics, stats, correlation: { labels, matrix } };
}
