import type { LucideIcon } from "lucide-react";
import {
  MessageSquareText, LayoutDashboard, Landmark, Factory, Users, Megaphone, Package, ShieldCheck, Wrench, Leaf, Compass,
  Warehouse, ShoppingCart, Handshake, Truck,
  UsersRound, CalendarClock, HardHat,
  Cpu, BrainCircuit, Target,
  BellRing, ScrollText, FolderOpen, PlugZap,
  CalendarRange, ListTree, Route, Radio, Boxes, Ruler, PackageOpen,
  Calculator, Wallet, Briefcase,
  Sprout, ShieldAlert, Building2, FlaskConical, GraduationCap, MessageSquareWarning,
  Search, GitBranch, Map, ChartScatter, LayoutGrid, Palette, KeyRound, FileText, Mail, Database,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
  /** Set for generic module routes rendered by app/(app)/[slug] */
  module?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const m = (slug: string, label: string, icon: LucideIcon, keywords?: string): NavItem => ({ href: `/${slug}`, label, icon, keywords, module: true });

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Genel",
    items: [
      { href: "/", label: "Ana Panel (Chatbot)", icon: MessageSquareText, keywords: "sohbet asistan veri analizi" },
      { href: "/dashboard", label: "Genel Dashboard", icon: LayoutDashboard, keywords: "performans oee" },
    ],
  },
  {
    title: "Fabrika Yönetimi",
    items: [
      m("finans", "Finansal Yönetim", Landmark, "gelir gider kâr"),
      m("uretim", "Üretim & Operasyonlar", Factory, "hat oee"),
      m("insan-kaynaklari", "İnsan Kaynakları", Users, "çalışan ik"),
      m("satis", "Satış & Pazarlama", Megaphone, "kampanya müşteri"),
      m("envanter", "Envanter & Tedarik Zinciri", Package, "stok tedarikçi"),
      m("kalite", "Kalite Yönetimi", ShieldCheck, "denetim ppm"),
      m("bakim", "Bakım Yönetimi", Wrench, "iş emri mttr"),
      m("enerji", "Enerji & Çevre", Leaf, "kwh karbon"),
      m("stratejik", "Stratejik Analizler", Compass, "swot risk"),
    ],
  },
  {
    title: "Tedarik & Lojistik",
    items: [
      m("stok", "Stok Yönetimi", Warehouse, "depo ürün kodu envanter raf"),
      m("satin-alma", "Satın Alma", ShoppingCart, "sipariş talep po tedarik"),
      m("tedarikciler", "Tedarikçi Yönetimi", Handshake, "firma performans sözleşme"),
      m("lojistik", "Lojistik & Sevkiyat", Truck, "kargo sevkiyat teslimat"),
    ],
  },
  {
    title: "Müşteri & İnsan",
    items: [
      m("musteriler", "Müşteri Yönetimi (CRM)", UsersRound, "crm hesap fırsat"),
      m("vardiya", "Vardiya Planlama", CalendarClock, "shift çizelge personel"),
      m("isg", "İş Sağlığı & Güvenliği", HardHat, "isg kaza ramak kala"),
    ],
  },
  {
    title: "Varlık & Zekâ",
    items: [
      m("varliklar", "Varlık & Makine Yönetimi", Cpu, "makine sensör ekipman"),
      m("tahmin", "AI Öngörü & Anomali", BrainCircuit, "yapay zeka tahmin anomali"),
      m("hedefler", "Hedef & KPI Takibi", Target, "okr hedef kpi"),
    ],
  },
  {
    title: "Yönetişim",
    items: [
      m("uyarilar", "Uyarı Merkezi", BellRing, "alarm bildirim"),
      m("denetim", "Denetim Günlüğü", ScrollText, "audit log kayıt"),
      m("belgeler", "Belge Yönetimi", FolderOpen, "doküman iso prosedür"),
      m("entegrasyonlar", "Entegrasyonlar", PlugZap, "erp mes iot api"),
    ],
  },
  {
    title: "Üretim Zekâsı",
    items: [
      m("uretim-planlama", "Üretim Planlama & Çizelgeleme", CalendarRange, "aps çizelge iş emri"),
      m("receteler", "Ürün Reçeteleri (BOM)", ListTree, "bom malzeme ağacı"),
      m("izlenebilirlik", "Parti & Seri İzlenebilirlik", Route, "lot seri geri çağırma"),
      m("iot-sensorler", "IoT Sensör İzleme", Radio, "sensör telemetri sıcaklık"),
      m("dijital-ikiz", "Dijital İkiz", Boxes, "simülasyon 3d model"),
      m("kalibrasyon", "Kalibrasyon Takibi", Ruler, "ölçüm cihazı sertifika"),
      m("yedek-parca", "Yedek Parça Stoku", PackageOpen, "parça bakım stok"),
    ],
  },
  {
    title: "Finans & Yatırım",
    items: [
      m("maliyet", "Maliyet Muhasebesi", Calculator, "birim maliyet masraf"),
      m("butce", "Bütçe & Nakit Akışı", Wallet, "bütçe nakit tahmin"),
      m("projeler", "Proje & Yatırım (CAPEX)", Briefcase, "capex proje yatırım"),
    ],
  },
  {
    title: "Kurumsal",
    items: [
      m("surdurulebilirlik", "Sürdürülebilirlik & ESG", Sprout, "esg karbon çevre"),
      m("risk-uyum", "Risk & Uyum", ShieldAlert, "risk uyum denetim"),
      m("tesisler", "Çoklu Tesis Karşılaştırma", Building2, "fabrika tesis benchmark"),
      m("arge", "Ar-Ge & Ürün Geliştirme", FlaskConical, "arge inovasyon patent"),
      m("egitim", "Eğitim & Yetkinlik", GraduationCap, "eğitim sertifika yetkinlik"),
      m("sikayetler", "Şikayet & Servis", MessageSquareWarning, "şikayet servis garanti"),
    ],
  },
  {
    title: "Analiz Araçları",
    items: [
      { href: "/analiz", label: "Detaylı Analiz", icon: Search, keywords: "korelasyon istatistik" },
      { href: "/senaryo", label: "Senaryo Analizi", icon: GitBranch, keywords: "simülasyon talep" },
      { href: "/gorsellestirme", label: "Görselleştirme Stüdyosu", icon: ChartScatter, keywords: "grafik chart builder studio" },
      { href: "/harita", label: "Harita Entegrasyonu", icon: Map, keywords: "lokasyon konum" },
    ],
  },
  {
    title: "Ayarlar & Yapılandırma",
    items: [
      { href: "/kisisel", label: "Kişisel Dashboard", icon: LayoutGrid, keywords: "widget" },
      { href: "/tema", label: "Tema Özelleştirme", icon: Palette, keywords: "renk" },
      { href: "/yetki", label: "Yetki Yönetimi", icon: KeyRound, keywords: "kullanıcı rol" },
      { href: "/rapor", label: "Rapor Oluşturma", icon: FileText, keywords: "pdf" },
      { href: "/eposta", label: "E-posta Gönderimi", icon: Mail, keywords: "zamanlanmış" },
      { href: "/veri-kaynaklari", label: "Veri Kaynakları", icon: Database, keywords: "csv excel api" },
    ],
  },
];

export const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

/** Canonical list of generic module slugs served by /api/modules/{slug} and app/(app)/[slug]. */
export const MODULE_SLUGS: string[] = ALL_NAV.filter((i) => i.module).map((i) => i.href.slice(1));

export function findNav(pathname: string): NavItem | undefined {
  const clean = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return ALL_NAV.find((i) => i.href === clean);
}

export function moduleLabel(slug: string): string {
  return ALL_NAV.find((i) => i.href === `/${slug}`)?.label ?? slug;
}
