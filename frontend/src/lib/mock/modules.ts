import type { ModuleData } from "../types";
import { adaptModule } from "../adapt";
import { MODULE_SLUGS, moduleLabel } from "../nav";
import generated from "./generated/modules.json";

const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const gelir = [0.82, 0.88, 0.95, 1.02, 1.08, 1.12, 1.05, 1.15, 1.2, 1.24, 1.3, 1.36];
const gider = [0.55, 0.57, 0.6, 0.62, 0.61, 0.66, 0.64, 0.68, 0.7, 0.71, 0.75, 0.78];

const handModules: Record<string, ModuleData> = {
  finans: {
    slug: "finans",
    title: "Finansal Yönetim Merkezi",
    subtitle: "Gelir, gider ve nakit akışının tek bakışta izlendiği finans paneli.",
    icon: "landmark",
    kpis: [
      { key: "gelir", label: "Toplam Gelir (YTD)", value: "₺12.8M", delta: "+15.2%", icon: "trending-up", color: "sand" },
      { key: "gider", label: "Toplam Gider (YTD)", value: "₺7.2M", delta: "+8.5%", icon: "wallet", color: "copper" },
      { key: "marj", label: "Net Kâr Marjı", value: "43.75", unit: "%", delta: "+2.1%", icon: "scale", color: "sage" },
      { key: "alacak", label: "Tahsil Edilecek Alacaklar", value: "₺1.2M", delta: "-5.0%", icon: "receipt", color: "steel" },
    ],
    sections: [
      {
        type: "table",
        title: "Aylık Gelir-Gider Özeti",
        columns: ["Kategori", "Bu Ay", "Geçen Ay", "Değişim"],
        align: ["left", "right", "right", "right"],
        rows: [
          ["Satış Gelirleri", "₺2.1M", "₺1.9M", "+10.5%"],
          ["Hammadde Maliyeti", "₺850K", "₺820K", "+3.6%"],
          ["İşletme Giderleri", "₺450K", "₺460K", "-2.2%"],
          ["Pazarlama Giderleri", "₺150K", "₺140K", "+7.1%"],
          ["Net Faaliyet Kârı", "₺650K", "₺480K", "+35.4%"],
        ],
      },
      {
        type: "chart",
        title: "12 Aylık Gelir ve Gider",
        chartType: "area",
        xKey: "ay",
        yKeys: ["Gelir", "Gider"],
        unit: "₺M",
        data: months.map((ay, i) => ({ ay, Gelir: gelir[i], Gider: gider[i] })),
      },
    ],
    toolsTitle: "Hızlı Erişim",
    tools: [
      { title: "Detaylı Finans Raporları", description: "Ayrıntılı gelir-gider tabloları, bilançolar ve nakit akış analizleri.", icon: "file-text" },
      { title: "Bütçe Takibi ve Planlama", description: "Departman bütçelerini izleyin, sapmaları analiz edin ve yeni bütçeler oluşturun.", icon: "list-checks" },
      { title: "Maliyet Analizi Araçları", description: "Ürün, süreç ve departman bazında maliyetleri derinlemesine inceleyin.", icon: "search-check" },
    ],
  },

  uretim: {
    slug: "uretim",
    title: "Üretim ve Operasyonlar Merkezi",
    subtitle: "Hat durumu, OEE ve plan-gerçekleşme karşılaştırması anlık olarak.",
    icon: "factory",
    kpis: [
      { key: "oee", label: "Ort. OEE Oranı", value: "82.5", unit: "%", delta: "+1.5%", icon: "gauge", color: "sand" },
      { key: "uretim", label: "Toplam Üretim (Bu Ay)", value: "17,450", unit: "birim", delta: "+5.2%", icon: "boxes", color: "steel" },
      { key: "durus", label: "Planlanmamış Duruş", value: "18", unit: "saat", delta: "-10%", icon: "timer-off", color: "copper" },
      { key: "fpy", label: "İlk Seferde Kalite Oranı", value: "97.8", unit: "%", delta: "+0.3%", icon: "badge-check", color: "sage" },
    ],
    sections: [
      {
        type: "cards",
        title: "Üretim Hatları Anlık Durum",
        cards: [
          { title: "Montaj Hattı 1", status: "Çalışıyor", value: "88%", subtitle: "OEE", progress: 88, meta: "Plan / Gerçek: 1200 / 1150" },
          { title: "Paketleme Hattı A", status: "Durdu", value: "75%", subtitle: "OEE", progress: 75, meta: "Plan / Gerçek: 800 / 600" },
          { title: "CNC İşleme Merkezi", status: "Bakımda", value: "92%", subtitle: "OEE", progress: 92, meta: "Plan / Gerçek: 500 / 480" },
          { title: "Montaj Hattı 2", status: "Çalışıyor", value: "91%", subtitle: "OEE", progress: 91, meta: "Plan / Gerçek: 1500 / 1400" },
        ],
      },
      {
        type: "chart",
        title: "Hat Bazında Plan ve Gerçekleşme",
        chartType: "bar",
        xKey: "hat",
        yKeys: ["Plan", "Gerçek"],
        data: [
          { hat: "Montaj 1", Plan: 1200, Gerçek: 1150 },
          { hat: "Paketleme A", Plan: 800, Gerçek: 600 },
          { hat: "CNC", Plan: 500, Gerçek: 480 },
          { hat: "Montaj 2", Plan: 1500, Gerçek: 1400 },
        ],
      },
    ],
    toolsTitle: "Raporlar ve Araçlar",
    tools: [
      { title: "Detaylı OEE Analizi", description: "Kullanılabilirlik, performans ve kalite bileşenlerini hat bazında inceleyin.", icon: "activity" },
      { title: "Üretim Planlama Takvimi", description: "Vardiya ve sipariş planlarını takvim görünümünde yönetin.", icon: "calendar-days" },
      { title: "Arıza ve Duruş Kayıtları", description: "Planlanmamış duruşların kök neden kayıtlarına erişin.", icon: "alert-triangle" },
      { title: "Kalite Kontrol Raporları", description: "Hat çıkışı kalite kontrol sonuçlarını görüntüleyin.", icon: "clipboard-check" },
    ],
  },

  "insan-kaynaklari": {
    slug: "insan-kaynaklari",
    title: "İnsan Kaynakları Yönetimi",
    subtitle: "Çalışan dağılımı, devir oranı ve gelişim göstergeleri.",
    icon: "users",
    kpis: [
      { key: "aktif", label: "Toplam Aktif Çalışan", value: "485", delta: "+12 yeni", icon: "users", color: "sand" },
      { key: "devir", label: "Personel Devir Oranı (Yıllık)", value: "8.2", unit: "%", delta: "-1.5%", icon: "repeat", color: "steel" },
      { key: "egitim", label: "Ort. Eğitim Saati (Kişi Başı)", value: "24", unit: "saat", delta: "+8%", icon: "graduation-cap", color: "sage" },
      { key: "isealim", label: "Ort. İşe Alım Süresi", value: "28", unit: "gün", delta: "-3 gün", icon: "hourglass", color: "copper" },
    ],
    sections: [
      {
        type: "cards",
        title: "Departman Bazında Çalışan Dağılımı",
        cards: [
          { title: "Üretim Departmanı", value: 280, subtitle: "çalışan", progress: 58 },
          { title: "Ar-Ge ve İnovasyon", value: 45, subtitle: "çalışan", progress: 9 },
          { title: "Satış ve Pazarlama", value: 60, subtitle: "çalışan", progress: 12 },
          { title: "Finans ve Muhasebe", value: 35, subtitle: "çalışan", progress: 7 },
          { title: "Lojistik ve Depo", value: 40, subtitle: "çalışan", progress: 8 },
          { title: "Yönetim ve İdari İşler", value: 25, subtitle: "çalışan", progress: 5 },
        ],
      },
    ],
    toolsTitle: "İK Sistemleri ve Araçlar",
    tools: [
      { title: "Performans Değerlendirme", description: "Dönemsel hedef ve yetkinlik değerlendirmelerini yönetin.", icon: "target" },
      { title: "Eğitim ve Gelişim Portalı", description: "Eğitim kataloğu, katılım ve sertifikasyon takibi.", icon: "book-open" },
      { title: "İşe Alım ve Yetenek Yönetimi", description: "Açık pozisyonlar, aday havuzu ve mülakat süreçleri.", icon: "user-plus" },
      { title: "Personel Arama ve Profil", description: "Çalışan profillerine ve organizasyon şemasına erişin.", icon: "search" },
    ],
  },

  satis: {
    slug: "satis",
    title: "Satış ve Pazarlama Merkezi",
    subtitle: "Satış hacmi, müşteri kazanımı ve kampanya takibi.",
    icon: "megaphone",
    kpis: [
      { key: "hacim", label: "Toplam Satış Hacmi (Bu Ay)", value: "₺3.2M", delta: "+12.5%", icon: "shopping-bag", color: "sand" },
      { key: "musteri", label: "Yeni Müşteri Sayısı", value: "128", delta: "+22", icon: "user-plus", color: "steel" },
      { key: "siparis", label: "Ort. Sipariş Değeri", value: "₺1,850", delta: "+4.8%", icon: "receipt", color: "sage" },
      { key: "kayip", label: "Müşteri Kayıp Oranı", value: "2.1", unit: "%", delta: "-0.5%", icon: "user-minus", color: "copper" },
    ],
    sections: [
      {
        type: "table",
        title: "Pazarlama Kampanyaları",
        columns: ["Kampanya Adı", "Platform", "Bitiş Tarihi", "Durum"],
        rows: [
          ["Yaz Sezonu İndirimleri", "Web Sitesi & Sosyal Medya", "2023-08-31", "Aktif"],
          ["Yeni Ürün Lansmanı", "E-posta & Influencer", "2023-09-15", "Planlandı"],
          ["Stok Eritme Fırsatları", "Pazaryerleri", "2023-08-20", "Tamamlandı"],
        ],
      },
    ],
    toolsTitle: "Satış Araçları ve Raporlar",
    tools: [
      { title: "Detaylı Satış Analizleri", description: "Bölge, kanal ve ürün kırılımında satış raporları.", icon: "bar-chart-3" },
      { title: "Müşteri Segmentasyonu", description: "Davranış ve değer bazlı müşteri gruplarını inceleyin.", icon: "pie-chart" },
      { title: "Kampanya Yönetimi", description: "Kampanya planlama, bütçe ve dönüşüm takibi.", icon: "megaphone" },
      { title: "Pazar Araştırması ve Trendler", description: "Sektör raporları ve rakip hareketleri.", icon: "trending-up" },
    ],
  },

  envanter: {
    slug: "envanter",
    title: "Envanter ve Tedarik Zinciri Yönetimi",
    subtitle: "Stok seviyeleri, tedarik süreleri ve kritik parçalar.",
    icon: "package",
    kpis: [
      { key: "devir", label: "Stok Devir Hızı", value: "6.8", unit: "kez/yıl", delta: "+0.5", icon: "refresh-cw", color: "sand" },
      { key: "dogruluk", label: "Envanter Doğruluğu", value: "98.9", unit: "%", delta: "+0.2%", icon: "check-circle", color: "sage" },
      { key: "tedarik", label: "Ort. Tedarik Süresi", value: "12.5", unit: "gün", delta: "-1 gün", icon: "truck", color: "steel" },
      { key: "tasima", label: "Taşıma Maliyeti (Birim Başı)", value: "₺12.75", delta: "-₺0.50", icon: "package", color: "copper" },
    ],
    sections: [
      {
        type: "table",
        title: "Kritik Stok Seviyeleri",
        columns: ["Ürün Adı", "Stok", "Min. Stok", "Tedarikçi", "Durum"],
        align: ["left", "right", "right", "left", "left"],
        rows: [
          ["MODEL-X Ana Kartı", 25, 20, "Elektronik A.Ş.", "Kritik"],
          ["A-PLUS Sensör Modülü", 150, 100, "Sensortek Ltd.", "—"],
          ["DELTA-9 Güç Ünitesi", 80, 50, "EnerjiMax A.Ş.", "Yeterli"],
          ["OMEGA Kasa Birimi", 220, 200, "MetalForm San.", "Yeterli"],
        ],
      },
    ],
    toolsTitle: "Araçlar ve Raporlar",
    tools: [
      { title: "Detaylı Envanter Analizi", description: "ABC analizi, yaşlandırma ve stok maliyeti raporları.", icon: "boxes" },
      { title: "Tedarikçi Performans Yönetimi", description: "Teslimat, kalite ve fiyat skorlarını izleyin.", icon: "handshake" },
      { title: "Talep Tahmini ve Planlama", description: "Mevsimsellik ve trend bazlı talep projeksiyonları.", icon: "line-chart" },
    ],
  },

  kalite: {
    slug: "kalite",
    title: "Kalite Yönetim Sistemi",
    subtitle: "Kontrol noktaları, hata oranları ve iyileştirme projeleri.",
    icon: "shield-check",
    kpis: [
      { key: "memnuniyet", label: "Müşteri Memnuniyet Oranı", value: "96.5", unit: "%", delta: "+1.2%", icon: "smile", color: "sand" },
      { key: "ppm", label: "Dış Hata Oranı (PPM)", value: "150", unit: "ppm", delta: "-25", icon: "alert-octagon", color: "steel" },
      { key: "maliyet", label: "İç Hata Maliyeti", value: "₺85K", delta: "-₺10K", icon: "coins", color: "copper" },
      { key: "proje", label: "Tamamlanan Kalite Projeleri", value: "18", delta: "+3", icon: "flag", color: "sage" },
    ],
    sections: [
      {
        type: "table",
        title: "Kalite Kontrol Noktaları Performansı",
        columns: ["Kontrol Noktası", "Son Denetim", "Uygunluk", "Sorumlu"],
        align: ["left", "left", "right", "left"],
        rows: [
          ["Hammadde Giriş Kontrolü", "2023-08-10", "99.5%", "A. Yılmaz"],
          ["Üretim Hattı A – Ara Kontrol", "2023-08-11", "98.2%", "B. Kaya"],
          ["Final Ürün Testi ve Sevkiyat Öncesi Kontrol", "2023-08-09", "99.8%", "C. Demir"],
          ["Paketleme ve Etiketleme Doğruluğu", "2023-08-10", "100%", "D. Can"],
        ],
      },
    ],
    toolsTitle: "Kalite Araçları ve Raporlar",
    tools: [
      { title: "Uygunsuzluk Yönetimi (CAPA)", description: "Düzeltici ve önleyici faaliyetleri kayıt altına alın.", icon: "clipboard-list" },
      { title: "Denetim ve Sertifikasyon", description: "İç/dış denetim takvimi ve sertifika geçerlilikleri.", icon: "award" },
      { title: "İstatistiksel Süreç Kontrolü (SPC)", description: "Kontrol grafikleri ve süreç yeterlilik analizleri.", icon: "activity" },
    ],
  },

  bakim: {
    slug: "bakim",
    title: "Bakım Yönetimi Merkezi",
    subtitle: "İş emirleri, arıza süreleri ve kestirimci bakım isabeti.",
    icon: "wrench",
    kpis: [
      { key: "uyum", label: "Planlı Bakım Uyumu", value: "92.7", unit: "%", delta: "+2.1%", icon: "calendar-check", color: "sand" },
      { key: "mttr", label: "Ort. Tamir Süresi (MTTR)", value: "4.2", unit: "saat", delta: "-0.5", icon: "timer", color: "steel" },
      { key: "ariza", label: "Bu Ayki Arıza Sayısı", value: "12", delta: "-3", icon: "alert-triangle", color: "copper" },
      { key: "kestirimci", label: "Kestirimci Bakım İsabet Oranı", value: "78.5", unit: "%", delta: "+5%", icon: "radar", color: "sage" },
    ],
    sections: [
      {
        type: "table",
        title: "Bekleyen Bakım İş Emirleri",
        columns: ["Makine/Ekipman", "Açıklama", "Öncelik", "Atanan", "Plan. Tarih"],
        rows: [
          ["CNC Torna #3", "Mil yatağı ses yapıyor, kontrol gerekli.", "Yüksek", "Bakım Ekibi A", "2023-08-16"],
          ["Pres Makinesi #1", "Hidrolik sistem periyodik bakımı.", "Orta", "M. Ali Usta", "2023-08-18"],
          ["Montaj Robotu #5", "Sensör kalibrasyonu yapılacak.", "Düşük", "Otomasyon Servisi", "2023-08-22"],
        ],
      },
    ],
    toolsTitle: "Bakım Araçları",
    tools: [
      { title: "Yeni İş Emri Oluştur", description: "Arıza veya periyodik bakım için iş emri açın.", icon: "plus-circle" },
      { title: "Tüm İş Emirleri", description: "Açık, devam eden ve kapanmış iş emirlerini listeleyin.", icon: "list" },
      { title: "Makine Bakım Geçmişi", description: "Ekipman bazında bakım ve arıza kronolojisi.", icon: "history" },
      { title: "Kestirimci Bakım Analizleri", description: "Sensör verisinden arıza öngörüleri.", icon: "radar" },
    ],
  },

  enerji: {
    slug: "enerji",
    title: "Enerji ve Çevre Yönetimi",
    subtitle: "Tüketim, karbon ayak izi ve geri dönüşüm göstergeleri.",
    icon: "leaf",
    kpis: [
      { key: "enerji", label: "Toplam Enerji Tüketimi (Bu Ay)", value: "250,000", unit: "kWh", delta: "-5%", icon: "zap", color: "sand" },
      { key: "su", label: "Su Kullanımı (Bu Ay)", value: "1,200", unit: "m³", delta: "-2%", icon: "droplets", color: "steel" },
      { key: "karbon", label: "Karbon Ayak İzi (Yıllık)", value: "1,500", unit: "tCO2e", delta: "-8%", icon: "cloud", color: "copper" },
      { key: "geri", label: "Atık Geri Dönüşüm Oranı", value: "75", unit: "%", delta: "+10%", icon: "recycle", color: "sage" },
    ],
    sections: [
      {
        type: "progress",
        title: "Enerji Tüketim Dağılımı (Aylık)",
        items: [
          { label: "Üretim Makineleri", value: 65, color: "steel" },
          { label: "Aydınlatma", value: 15, color: "warn" },
          { label: "HVAC Sistemleri", value: 12, color: "sage" },
          { label: "Ofis Ekipmanları", value: 5, color: "lavender" },
          { label: "Diğer", value: 3, color: "muted" },
        ],
      },
    ],
    toolsTitle: "Araçlar ve Raporlar",
    tools: [
      { title: "Detaylı Enerji Analizi", description: "Hat ve vardiya bazında tüketim profilleri.", icon: "zap" },
      { title: "Çevre Uygunluk Raporları", description: "Emisyon ve atık mevzuat uyum raporları.", icon: "file-check" },
      { title: "Sürdürülebilirlik Projeleri", description: "Enerji tasarrufu ve yenilenebilir yatırım takibi.", icon: "leaf" },
      { title: "Risk ve Uyarı Yönetimi", description: "Eşik aşımı uyarıları ve müdahale kayıtları.", icon: "bell-ring" },
    ],
  },

  stratejik: {
    slug: "stratejik",
    title: "Stratejik Analizler ve Öngörüler",
    subtitle: "Pazar konumu, risk puanı ve SWOT özeti.",
    icon: "compass",
    kpis: [
      { key: "pazar", label: "Pazar Payı Değişimi (Yıllık)", value: "+2.5", unit: "%", icon: "pie-chart", color: "sand" },
      { key: "urun", label: "Yeni Ürün Başarı Oranı", value: "65", unit: "%", delta: "+10%", icon: "rocket", color: "steel" },
      { key: "risk", label: "Genel Risk Puanı", value: "4.2", unit: "/10", delta: "-0.8", icon: "shield-alert", color: "copper" },
      { key: "rekabet", label: "Rekabet Yoğunluk Endeksi", value: "Yüksek", icon: "swords", color: "warn" },
    ],
    sections: [
      {
        type: "swot",
        title: "SWOT Analizi Özeti",
        quadrants: [
          { key: "strengths", title: "Güçlü Yönler", items: ["Güçlü marka bilinirliği", "Yenilikçi ürün portföyü", "Deneyimli yönetim ekibi", "Yüksek üretim kapasitesi"] },
          { key: "weaknesses", title: "Zayıf Yönler", items: ["Bazı pazarlarda sınırlı dağıtım ağı", "Yüksek hammadde bağımlılığı", "Dijital pazarlamada gelişme ihtiyacı"] },
          { key: "opportunities", title: "Fırsatlar", items: ["Yeni gelişen pazarlara açılma", "E-ticaret kanalını güçlendirme", "Sürdürülebilir üretim teknolojileri", "Stratejik ortaklıklar"] },
          { key: "threats", title: "Tehditler", items: ["Artan rekabet baskısı", "Hammadde fiyatlarındaki dalgalanmalar", "Değişen tüketici tercihleri", "Ekonomik belirsizlikler"] },
        ],
      },
    ],
    toolsTitle: "Strateji Araçları",
    tools: [
      { title: "Rekabet Analizi Detayları", description: "Rakip konumlandırma ve pazar payı karşılaştırmaları.", icon: "swords" },
      { title: "Senaryo Planlama ve Simülasyon", description: "Talep ve maliyet senaryolarını modelleyin.", icon: "git-branch" },
      { title: "Pazar Fırsatları ve Risk Değerlendirme", description: "Fırsat-risk matrisi ve öncelik önerileri.", icon: "compass" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Generated mocks: `npm run sync-mock` snapshots the live backend    */
/*  into generated/modules.json. Raw JSON is run through the same      */
/*  adapter the API path uses, so both sources yield identical shapes. */
/*  Hand-written entries above win over generated ones.                */
/* ------------------------------------------------------------------ */
type GeneratedFile = { fetchedAt: string | null; list: unknown[]; modules: Record<string, Record<string, unknown>> };
const gen = generated as unknown as GeneratedFile;

const generatedModules: Record<string, ModuleData> = {};
for (const [slug, raw] of Object.entries(gen.modules ?? {})) {
  try {
    generatedModules[slug] = adaptModule(raw, slug);
  } catch {
    // a malformed snapshot entry must never break the import graph
  }
}

/** Minimal, honest placeholder for a module with neither a hand-written nor a generated mock. */
export function emptyModule(slug: string): ModuleData {
  return {
    slug,
    title: moduleLabel(slug),
    subtitle: "Bu modülün verisi henüz senkronlanmadı. Backend erişilebilir olduğunda içerik otomatik gelir.",
    icon: "layout-grid",
    kpis: [],
    sections: [],
    tools: [],
  };
}

export const modulesMock: Record<string, ModuleData> = Object.fromEntries(
  MODULE_SLUGS.map((slug) => [slug, handModules[slug] ?? generatedModules[slug] ?? emptyModule(slug)]),
);

export { MODULE_SLUGS };
