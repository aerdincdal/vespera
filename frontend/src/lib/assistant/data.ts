import type { Row } from "./types";

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
export const HR_DATASET_URL = `${BASE}/data/hr_personel_tr.json`;
export const HR_DATASET_NAME = "İK Personel Verisi (örnek)";

let cache: Promise<Row[]> | null = null;

/** Lazy-load and cache the bundled Turkish HR dataset (public/data/hr_personel_tr.json). */
export function loadHrDataset(): Promise<Row[]> {
  if (!cache) {
    cache = fetch(HR_DATASET_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Veri seti yüklenemedi (${r.status})`);
        return r.json() as Promise<Row[]>;
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}
