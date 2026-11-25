import type { AvailableWidget, DataSource, Report, Role, ScheduledEmail, User, Widget } from "../types";

export const widgetsMock: Widget[] = [
  { id: "w1", title: "Gelir Gider Grafiği", type: "chart", typeLabel: "Grafik", size: "wide", sizeLabel: "Geniş", enabled: true, order: 0 },
  { id: "w2", title: "Müşteri Dağılımı", type: "pie", typeLabel: "Pasta", size: "narrow", sizeLabel: "Dar", enabled: true, order: 1 },
  { id: "w3", title: "Satış Tablosu", type: "table", typeLabel: "Tablo", size: "medium", sizeLabel: "Orta", enabled: true, order: 2 },
];

export const availableWidgetsMock: AvailableWidget[] = [
  { key: "bolge", title: "Bölge Performansı", type: "bar", size: "medium" },
  { key: "departman", title: "Departman Bazlı Performans", type: "bar", size: "medium" },
  { key: "stok", title: "Stok Düzeyi", type: "progress", size: "narrow" },
  { key: "hedef", title: "Hedef Gerçekleşme", type: "progress", size: "narrow" },
];

export const usersMock: User[] = [
  { id: "u1", name: "Ahmet Yılmaz", email: "ahmet@ornek.com", role: "Admin", status: "Aktif", lastLogin: "2 saat önce" },
  { id: "u2", name: "Ayşe Demir", email: "ayse@ornek.com", role: "Yönetici", status: "Aktif", lastLogin: "1 gün önce" },
  { id: "u3", name: "Mehmet Kaya", email: "mehmet@ornek.com", role: "Analist", status: "Aktif", lastLogin: "3 saat önce" },
  { id: "u4", name: "Zeynep Şahin", email: "zeynep@ornek.com", role: "Gözlemci", status: "Aktif", lastLogin: "5 gün önce" },
  { id: "u5", name: "Ali Yıldız", email: "ali@ornek.com", role: "Yönetici", status: "Pasif", lastLogin: "30 gün önce" },
];

export const PERMISSION_MODULES = [
  "Genel Dashboard", "Finansal Yönetim", "Üretim & Operasyonlar", "İnsan Kaynakları", "Satış & Pazarlama",
  "Envanter & Tedarik", "Kalite Yönetimi", "Bakım Yönetimi", "Enerji & Çevre", "Stratejik Analizler",
  "Rapor Oluşturma", "Yetki Yönetimi",
];

const perm = (allow: (m: string, i: number) => boolean) =>
  Object.fromEntries(PERMISSION_MODULES.map((m, i) => [m, allow(m, i)]));

export const rolesMock: Role[] = [
  { name: "Admin", description: "Tüm modüllere tam erişim", permissions: perm(() => true) },
  { name: "Yönetici", description: "Operasyonel modüller ve raporlar", permissions: perm((m) => m !== "Yetki Yönetimi") },
  { name: "Analist", description: "Analiz ve rapor odaklı erişim", permissions: perm((m) => !["Yetki Yönetimi", "İnsan Kaynakları", "Finansal Yönetim"].includes(m)) },
  { name: "Gözlemci", description: "Yalnızca görüntüleme", permissions: perm((m) => ["Genel Dashboard", "Üretim & Operasyonlar", "Kalite Yönetimi"].includes(m)) },
];

export const reportsMock: Report[] = [
  {
    id: "r1",
    name: "Aylık Satış Raporu",
    reportType: "Özet Rapor",
    description: "Mayıs 2023 satış performansı özeti.",
    updatedAt: "2023-06-02",
    components: [
      { id: "c1", type: "title", label: "Rapor Başlığı", content: "Aylık Satış Raporu – Mayıs 2023" },
      { id: "c2", type: "text", label: "Giriş Metni", content: "Bu rapor, Mayıs 2023 ayına ait satış verilerini içermektedir. Raporda bölge bazlı satış performansı, ürün kategorisi bazında satışlar ve geçen yıl verileri ile karşılaştırmalar yer almaktadır." },
      { id: "c3", type: "chart", label: "Satış Grafiği", source: "Aylık Satışlar" },
      { id: "c4", type: "table", label: "Ürün Kategorisi Satışları", source: "Ürün Kategorisi Satışları" },
    ],
  },
];

export const REPORT_CHART_SOURCES = ["Aylık Satışlar", "Bölge Bazlı Satışlar", "Kategori Dağılımı"];
export const REPORT_TABLE_SOURCES = ["Ürün Kategorisi Satışları", "Bölge Performansı", "En Çok Satan Ürünler"];

export const reportChartData = [
  { ay: "Oca", Satış: 2.4 }, { ay: "Şub", Satış: 2.6 }, { ay: "Mar", Satış: 2.9 }, { ay: "Nis", Satış: 3.0 }, { ay: "May", Satış: 3.2 },
];
export const reportTableData = {
  columns: ["Kategori", "Satış", "Büyüme", "Durum"],
  rows: [
    ["Elektronik", "₺1.2M", "+14%", "Yüksek"],
    ["Endüstriyel", "₺840K", "+6%", "Orta"],
    ["Aksesuar", "₺420K", "-3%", "Düşük"],
    ["Servis", "₺310K", "+9%", "Orta"],
  ] as Array<Array<string | number>>,
};

export const emailsMock: ScheduledEmail[] = [
  { id: "e1", subject: "Haftalık Satış Raporu", recipients: ["Yönetim Ekibi", "Satış Ekibi"], reports: ["Aylık Satış Raporu", "Haftalık Performans Özeti"], schedule: "Her Pazartesi 09:00", lastSent: "2023-04-24", status: "Aktif" },
  { id: "e2", subject: "Aylık Performans Değerlendirmesi", recipients: ["Yönetim Ekibi", "Pazarlama Ekibi", "İK Ekibi"], reports: ["Haftalık Performans Özeti", "Finansal Özet"], schedule: "Her ayın 1. günü 10:00", lastSent: "2023-05-01", status: "Aktif" },
  { id: "e3", subject: "Müşteri Analiz Raporu", recipients: ["Yönetim Ekibi", "Satış Ekibi", "Pazarlama Ekibi"], reports: ["Müşteri Analizi"], schedule: "Her ayın 15. günü 14:00", lastSent: "2023-04-15", status: "Pasif" },
];

export const RECIPIENT_GROUPS = ["Yönetim Ekibi", "Satış Ekibi", "Pazarlama Ekibi", "İK Ekibi", "Finans Ekibi", "Üretim Ekibi"];
export const REPORT_OPTIONS = ["Aylık Satış Raporu", "Haftalık Performans Özeti", "Finansal Özet", "Müşteri Analizi", "Üretim Özeti"];
export const SCHEDULE_OPTIONS = ["Her gün 08:00", "Her Pazartesi 09:00", "Her ayın 1. günü 10:00", "Her ayın 15. günü 14:00", "Her Cuma 17:00"];

export const datasourcesMock: DataSource[] = [
  { id: "d1", name: "CRM Veritabanı", type: "Veritabanı", connection: "mssql://user:****@crm-server/crm_db", recordCount: "1,250,000+", size: "4.5 GB", updatedAt: "2 saat önce", status: "Bağlı" },
  { id: "d2", name: "Satış Verileri", type: "Excel Dosyası", connection: "/data/satis_verileri_2023.xlsx", recordCount: "45,800", size: "12 MB", updatedAt: "1 gün önce", status: "Bağlı" },
  { id: "d3", name: "Müşteri API", type: "API / Web Servisi", connection: "https://api.example.com/customers", recordCount: "350,000+", size: "N/A", updatedAt: "30 dk önce", status: "Bağlı" },
  { id: "d4", name: "Ürün Kataloğu", type: "Dosya Yükleme", connection: "/data/urun_katalogu.csv", recordCount: "25,000", size: "8 MB", updatedAt: "5 gün önce", status: "Bağlantı Yok" },
];
