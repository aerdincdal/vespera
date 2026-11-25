import type { Location } from "../types";

export const locationsMock: Location[] = [
  { id: "ist", name: "İstanbul Merkez Ofis", region: "Marmara", type: "Ofis", performance: "Yüksek", value: 4_250_000, trend: "+12%", lat: 41.0082, lng: 28.9784 },
  { id: "ank", name: "Ankara Şube", region: "İç Anadolu", type: "Şube", performance: "Orta", value: 2_750_000, trend: "+5%", lat: 39.9334, lng: 32.8597 },
  { id: "izm", name: "İzmir Fabrika", region: "Ege", type: "Fabrika", performance: "Yüksek", value: 5_100_000, trend: "+8%", lat: 38.4237, lng: 27.1428 },
  { id: "brs", name: "Bursa Üretim Tesisi", region: "Marmara", type: "Fabrika", performance: "Orta", value: 2_400_000, trend: "+3%", lat: 40.1885, lng: 29.061 },
  { id: "ant", name: "Antalya Depo", region: "Akdeniz", type: "Depo", performance: "Düşük", value: 600_000, trend: "-2%", lat: 36.8969, lng: 30.7133 },
  { id: "gzt", name: "Gaziantep Şube", region: "Güneydoğu", type: "Şube", performance: "Orta", value: 1_000_000, trend: "+1%", lat: 37.0662, lng: 37.3833 },
];
