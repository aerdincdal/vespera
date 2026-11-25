import type { LiveData, Notification } from "../types";

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const notificationsMock: Notification[] = [
  { id: "n-1", title: "Montaj Hattı 2 OEE hedefin altında", body: "Son 30 dakikada OEE %74'e düştü; darboğaz istasyon M2-04.", level: "warn", time: ago(6), read: false, href: "/uretim" },
  { id: "n-2", title: "Kritik stok: RM-4471 Alüminyum profil", body: "Depo A rafı 12-B'de 3 günlük stok kaldı, minimum seviyenin altında.", level: "err", time: ago(22), read: false, href: "/stok" },
  { id: "n-3", title: "PO-2026-0917 onaylandı", body: "Ege Metal San. siparişi satın alma müdürü tarafından onaylandı.", level: "ok", time: ago(48), read: false, href: "/satin-alma" },
  { id: "n-4", title: "Anomali tespiti: Kompresör K-3 titreşim", body: "Sensör VIB-K3-01 son 2 saatte 3σ üzerinde 5 ölçüm kaydetti.", level: "warn", time: ago(95), read: false, href: "/tahmin" },
  { id: "n-5", title: "Sevkiyat SVK-88213 yola çıktı", body: "İzmir bölge deposuna 14 palet; tahmini varış 17:40.", level: "info", time: ago(140), read: true, href: "/lojistik" },
  { id: "n-6", title: "Haftalık kalite raporu hazır", body: "PPM 312, ilk seferde kalite %97.8. Rapor e-posta ile gönderildi.", level: "ok", time: ago(310), read: true, href: "/kalite" },
  { id: "n-7", title: "Bakım iş emri WO-5521 gecikti", body: "CNC-07 planlı bakımı 1 gün gecikmede; teknisyen atanmadı.", level: "err", time: ago(420), read: true, href: "/bakim" },
  { id: "n-8", title: "Yeni kullanıcı eklendi", body: "Selin Aydın (Analist) rolüyle sisteme tanımlandı.", level: "info", time: ago(1500), read: true, href: "/yetki" },
];

export const liveMock: LiveData = {
  ts: new Date().toISOString(),
  lines: [
    { name: "Montaj 1", oee: 88.4, rate: 1150, temp: 41.2, status: "Çalışıyor" },
    { name: "Montaj 2", oee: 91.0, rate: 1420, temp: 39.8, status: "Çalışıyor" },
    { name: "Paketleme A", oee: 75.6, rate: 610, temp: 36.1, status: "Çalışıyor" },
    { name: "CNC Merkezi", oee: 92.3, rate: 480, temp: 44.7, status: "Çalışıyor" },
  ],
  plant: { energyKw: 1240, activeStaff: 312, openAlerts: 4 },
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const jitter = (amp: number) => (Math.random() - 0.5) * 2 * amp;

/** Offline fallback: gentle random walk around the previous tick so the strip still breathes. */
export function liveRandomWalk(prev: LiveData = liveMock): LiveData {
  return {
    ts: new Date().toISOString(),
    lines: prev.lines.map((l) => ({
      ...l,
      oee: Math.round(clamp(l.oee + jitter(0.6), 60, 99) * 10) / 10,
      rate: Math.round(clamp(l.rate + jitter(18), 100, 2500)),
      temp: l.temp === undefined ? undefined : Math.round(clamp(l.temp + jitter(0.3), 25, 70) * 10) / 10,
    })),
    plant: {
      energyKw: Math.round(clamp(prev.plant.energyKw + jitter(14), 600, 2400)),
      activeStaff: Math.round(clamp(prev.plant.activeStaff + (Math.random() < 0.15 ? Math.sign(jitter(1)) : 0), 200, 400)),
      openAlerts: Math.round(clamp(prev.plant.openAlerts + (Math.random() < 0.08 ? Math.sign(jitter(1)) : 0), 0, 12)),
    },
  };
}
