import type { DashboardData } from "../types";

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
const line1 = [88, 91, 93, 89, 94, 95, 92, 90];
const line2 = [84, 86, 82, 88, 85, 87, 91, 89];

export const dashboardMock: DashboardData = {
  kpis: [
    { key: "oee", label: "Ortalama OEE", value: "92.5", unit: "%", delta: "+2.3%", description: "Genel Ekipman Etkinliği", color: "steel" },
    { key: "energy", label: "Enerji Verimliliği", value: "88", unit: "%", delta: "+4.5%", description: "Hedeflenen tüketimin altında", color: "sage" },
    { key: "quality", label: "Kalite Oranı", value: "99.2", unit: "%", delta: "+0.8%", description: "Hatasız üretim oranı", color: "copper" },
    { key: "downtime", label: "Planlı Duruş", value: "2.3", unit: "%", delta: "-1.2%", description: "Bakım ve ayar süreleri", color: "warn" },
  ],
  machineSeries: hours.map((time, i) => ({ time, "Üretim Hattı 1": line1[i], "Üretim Hattı 2": line2[i] })),
  personnel: [
    { name: "Verimlilik", value: 88, color: "steel" },
    { name: "Kalite", value: 92, color: "copper" },
    { name: "İş Güvenliği", value: 95, color: "sage" },
    { name: "Takım Çalışması", value: 84, color: "lavender" },
    { name: "İnovasyon", value: 76, color: "rose" },
  ],
  forecast: { thisWeek: "12,500 Birim", nextWeek: "13,200 Birim", trend: "+5.6%", confidence: "92%" },
  indicators: [
    { label: "Makine Kullanım Oranı", value: 85, color: "steel" },
    { label: "Enerji Tüketimi", value: 72, color: "sage" },
    { label: "İş Güvenliği Skoru", value: 95, color: "copper" },
    { label: "Kalite Kontrol", value: 88, color: "warn" },
  ],
};
