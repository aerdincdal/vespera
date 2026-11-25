# -*- coding: utf-8 -*-
"""Simulated data for VESPERA (App On Inc.), reproduced from docs/SPEC.md sections 4 and 8."""

from __future__ import annotations

# Section 7 palette (used for defaults / chart colors)
PALETTE = {
    "primary": "#c4b28d",
    "secondary": "#7f9fcf",
    "accent": "#c8875a",
    "success": "#7fb28a",
    "warning": "#d9b86a",
    "danger": "#c96b6b",
    "info": "#7f9fcf",
    "background": "#0b1528",
    "card": "#172b4d",
    "text": "#f6f1e7",
    "sage": "#8fa98a",
    "rose": "#b8707a",
    "lavender": "#9b8fbf",
    "muted": "#8b7a55",
}

SERIES_COLORS = ["#c4b28d", "#7f9fcf", "#c8875a", "#8fa98a", "#b8707a", "#9b8fbf"]

# ---------------------------------------------------------------------------
# 4.2 Genel Dashboard
# ---------------------------------------------------------------------------
DASHBOARD = {
    "title": "Fabrika Performans Analizi",
    "kpis": [
        {"key": "oee", "label": "Ortalama OEE", "value": 92.5, "unit": "%", "delta": 2.3, "deltaLabel": "+2.3%", "description": "Genel Ekipman Etkinliği", "color": "primary"},
        {"key": "energy", "label": "Enerji Verimliliği", "value": 88, "unit": "%", "delta": 4.5, "deltaLabel": "+4.5%", "description": "Hedeflenen tüketimin altında", "color": "success"},
        {"key": "quality", "label": "Kalite Oranı", "value": 99.2, "unit": "%", "delta": 0.8, "deltaLabel": "+0.8%", "description": "Hatasız üretim oranı", "color": "accent"},
        {"key": "downtime", "label": "Planlı Duruş", "value": 2.3, "unit": "%", "delta": -1.2, "deltaLabel": "-1.2%", "description": "Bakım ve ayar süreleri", "color": "warning"},
    ],
    "machineSeries": [
        {"time": "08:00", "Üretim Hattı 1": 85, "Üretim Hattı 2": 82},
        {"time": "09:00", "Üretim Hattı 1": 88, "Üretim Hattı 2": 84},
        {"time": "10:00", "Üretim Hattı 1": 91, "Üretim Hattı 2": 87},
        {"time": "11:00", "Üretim Hattı 1": 93, "Üretim Hattı 2": 89},
        {"time": "12:00", "Üretim Hattı 1": 90, "Üretim Hattı 2": 86},
        {"time": "13:00", "Üretim Hattı 1": 92, "Üretim Hattı 2": 88},
        {"time": "14:00", "Üretim Hattı 1": 95, "Üretim Hattı 2": 91},
        {"time": "15:00", "Üretim Hattı 1": 94, "Üretim Hattı 2": 90},
    ],
    "personnel": [
        {"name": "Verimlilik", "value": 88, "color": "#c4b28d"},
        {"name": "Kalite", "value": 92, "color": "#c8875a"},
        {"name": "İş Güvenliği", "value": 95, "color": "#8fa98a"},
        {"name": "Takım Çalışması", "value": 85, "color": "#9b8fbf"},
        {"name": "İnovasyon", "value": 78, "color": "#b8707a"},
    ],
    "forecast": {
        "thisWeek": 12500,
        "nextWeek": 13200,
        "unit": "Birim",
        "trend": 5.6,
        "trendLabel": "+5.6%",
        "confidence": 92,
    },
    "indicators": [
        {"label": "Makine Kullanım Oranı", "value": 85, "color": "primary"},
        {"label": "Enerji Tüketimi", "value": 72, "color": "success"},
        {"label": "İş Güvenliği Skoru", "value": 95, "color": "accent"},
        {"label": "Kalite Kontrol", "value": 88, "color": "warning"},
    ],
}

# ---------------------------------------------------------------------------
# 4.3 – 4.11 Modules
# ---------------------------------------------------------------------------
_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
_REVENUE = [0.92, 0.98, 1.05, 1.02, 1.10, 1.15, 1.08, 1.12, 1.18, 1.22, 1.20, 1.28]  # ₺M
_EXPENSE = [0.55, 0.58, 0.60, 0.59, 0.62, 0.64, 0.61, 0.63, 0.66, 0.67, 0.66, 0.69]

FINANS_CHART = [
    {"month": m, "Gelir": r, "Gider": e, "Kâr": round(r - e, 2)}
    for m, r, e in zip(_MONTHS, _REVENUE, _EXPENSE)
]

URETIM_OEE_CHART = [
    {"day": "Pzt", "OEE": 81.2},
    {"day": "Sal", "OEE": 83.5},
    {"day": "Çar", "OEE": 80.4},
    {"day": "Per", "OEE": 84.1},
    {"day": "Cum", "OEE": 82.9},
    {"day": "Cmt", "OEE": 79.8},
    {"day": "Paz", "OEE": 85.6},
]

MODULES = {
    "finans": {
        "slug": "finans",
        "title": "Finansal Yönetim Merkezi",
        "navTitle": "Finansal Yönetim",
        "icon": "landmark",
        "subtitle": "Gelir, gider ve kârlılık göstergelerinin tek ekranda takibi",
        "kpis": [
            {"key": "revenue", "label": "Toplam Gelir (YTD)", "value": "₺12.8M", "unit": "", "delta": 15.2, "deltaLabel": "+15.2%", "description": "Yıl başından bugüne", "color": "primary"},
            {"key": "expense", "label": "Toplam Gider (YTD)", "value": "₺7.2M", "unit": "", "delta": 8.5, "deltaLabel": "+8.5%", "description": "Yıl başından bugüne", "color": "accent"},
            {"key": "margin", "label": "Net Kâr Marjı", "value": 43.75, "unit": "%", "delta": 2.1, "deltaLabel": "+2.1%", "description": "Net kâr / gelir", "color": "success"},
            {"key": "receivables", "label": "Tahsil Edilecek Alacaklar", "value": "₺1.2M", "unit": "", "delta": -5.0, "deltaLabel": "-5.0%", "description": "Açık alacak bakiyesi", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Aylık Gelir-Gider Özeti",
                "columns": [
                    {"key": "category", "label": "Kategori"},
                    {"key": "thisMonth", "label": "Bu Ay", "align": "right"},
                    {"key": "lastMonth", "label": "Geçen Ay", "align": "right"},
                    {"key": "change", "label": "Değişim", "align": "right"},
                ],
                "rows": [
                    {"category": "Satış Gelirleri", "thisMonth": "₺2.1M", "lastMonth": "₺1.9M", "change": "+10.5%", "direction": "up", "positive": True},
                    {"category": "Hammadde Maliyeti", "thisMonth": "₺850K", "lastMonth": "₺820K", "change": "+3.6%", "direction": "down", "positive": False},
                    {"category": "İşletme Giderleri", "thisMonth": "₺450K", "lastMonth": "₺460K", "change": "-2.2%", "direction": "up", "positive": True},
                    {"category": "Pazarlama Giderleri", "thisMonth": "₺150K", "lastMonth": "₺140K", "change": "+7.1%", "direction": "down", "positive": False},
                    {"category": "Net Faaliyet Kârı", "thisMonth": "₺650K", "lastMonth": "₺480K", "change": "+35.4%", "direction": "up", "positive": True},
                ],
            },
            {
                "type": "chart",
                "title": "12 Aylık Gelir / Gider (₺M)",
                "chartType": "area",
                "data": FINANS_CHART,
                "xKey": "month",
                "yKeys": ["Gelir", "Gider"],
            },
        ],
        "toolsTitle": "Hızlı Erişim",
        "tools": [
            {"title": "Detaylı Finans Raporları", "description": "Gelir tablosu, bilanço ve nakit akışı raporları.", "icon": "file-bar-chart"},
            {"title": "Bütçe Takibi ve Planlama", "description": "Bütçe hedefleri ve gerçekleşme karşılaştırması.", "icon": "calendar-check"},
            {"title": "Maliyet Analizi Araçları", "description": "Ürün ve süreç bazlı maliyet kırılımları.", "icon": "calculator"},
        ],
    },
    "uretim": {
        "slug": "uretim",
        "title": "Üretim ve Operasyonlar Merkezi",
        "navTitle": "Üretim & Operasyonlar",
        "icon": "factory",
        "subtitle": "Hat bazlı anlık durum, OEE ve üretim planı gerçekleşmeleri",
        "kpis": [
            {"key": "oee", "label": "Ort. OEE Oranı", "value": 82.5, "unit": "%", "delta": 1.5, "deltaLabel": "+1.5%", "description": "Tüm hatların ortalaması", "color": "primary"},
            {"key": "output", "label": "Toplam Üretim (Bu Ay)", "value": "17,450", "unit": "birim", "delta": 5.2, "deltaLabel": "+5.2%", "description": "Aylık toplam çıktı", "color": "success"},
            {"key": "unplanned", "label": "Planlanmamış Duruş", "value": 18, "unit": "saat", "delta": -10, "deltaLabel": "-10%", "description": "Bu ay toplam", "color": "warning"},
            {"key": "fpy", "label": "İlk Seferde Kalite Oranı", "value": 97.8, "unit": "%", "delta": 0.3, "deltaLabel": "+0.3%", "description": "First pass yield", "color": "accent"},
        ],
        "sections": [
            {
                "type": "lines",
                "title": "Üretim Hatları Anlık Durum",
                "items": [
                    {"name": "Montaj Hattı 1", "status": "running", "statusLabel": "Çalışıyor", "oee": 88, "plan": 1200, "actual": 1150},
                    {"name": "Paketleme Hattı A", "status": "stopped", "statusLabel": "Durdu", "oee": 75, "plan": 800, "actual": 600},
                    {"name": "CNC İşleme Merkezi", "status": "maintenance", "statusLabel": "Bakımda", "oee": 92, "plan": 500, "actual": 480},
                    {"name": "Montaj Hattı 2", "status": "running", "statusLabel": "Çalışıyor", "oee": 91, "plan": 1500, "actual": 1400},
                ],
            },
            {
                "type": "chart",
                "title": "Son 7 Gün OEE (%)",
                "chartType": "bar",
                "data": URETIM_OEE_CHART,
                "xKey": "day",
                "yKeys": ["OEE"],
            },
        ],
        "toolsTitle": "Raporlar ve Araçlar",
        "tools": [
            {"title": "Detaylı OEE Analizi", "description": "Kullanılabilirlik, performans ve kalite kırılımı.", "icon": "gauge"},
            {"title": "Üretim Planlama Takvimi", "description": "Hat ve vardiya bazlı üretim planı.", "icon": "calendar-days"},
            {"title": "Arıza ve Duruş Kayıtları", "description": "Duruş nedenleri ve süre analizleri.", "icon": "alert-triangle"},
            {"title": "Kalite Kontrol Raporları", "description": "Hat çıkışı kalite kontrol sonuçları.", "icon": "clipboard-check"},
        ],
    },
    "insan-kaynaklari": {
        "slug": "insan-kaynaklari",
        "title": "İnsan Kaynakları Yönetimi",
        "navTitle": "İnsan Kaynakları",
        "icon": "users",
        "subtitle": "Çalışan dağılımı, devir ve gelişim göstergeleri",
        "kpis": [
            {"key": "headcount", "label": "Toplam Aktif Çalışan", "value": 485, "unit": "", "delta": 12, "deltaLabel": "+12 yeni", "description": "Aktif personel sayısı", "color": "primary"},
            {"key": "turnover", "label": "Personel Devir Oranı (Yıllık)", "value": 8.2, "unit": "%", "delta": -1.5, "deltaLabel": "-1.5%", "description": "Son 12 ay", "color": "success"},
            {"key": "training", "label": "Ort. Eğitim Saati (Kişi Başı)", "value": 24, "unit": "saat", "delta": 8, "deltaLabel": "+8%", "description": "Yıllık ortalama", "color": "accent"},
            {"key": "hiring", "label": "Ort. İşe Alım Süresi", "value": 28, "unit": "gün", "delta": -3, "deltaLabel": "-3 gün", "description": "İlan → teklif kabul", "color": "warning"},
        ],
        "sections": [
            {
                "type": "cards",
                "title": "Departman Bazında Çalışan Dağılımı",
                "items": [
                    {"title": "Üretim Departmanı", "value": 280, "unit": "çalışan"},
                    {"title": "Ar-Ge ve İnovasyon", "value": 45, "unit": "çalışan"},
                    {"title": "Satış ve Pazarlama", "value": 60, "unit": "çalışan"},
                    {"title": "Finans ve Muhasebe", "value": 35, "unit": "çalışan"},
                    {"title": "Lojistik ve Depo", "value": 40, "unit": "çalışan"},
                    {"title": "Yönetim ve İdari İşler", "value": 25, "unit": "çalışan"},
                ],
            },
        ],
        "toolsTitle": "İK Sistemleri ve Araçlar",
        "tools": [
            {"title": "Performans Değerlendirme", "description": "Dönemsel hedef ve yetkinlik değerlendirmeleri.", "icon": "target"},
            {"title": "Eğitim ve Gelişim Portalı", "description": "Eğitim katalogları ve tamamlama takibi.", "icon": "graduation-cap"},
            {"title": "İşe Alım ve Yetenek Yönetimi", "description": "Açık pozisyonlar ve aday havuzu.", "icon": "user-plus"},
            {"title": "Personel Arama ve Profil", "description": "Çalışan dizini ve profil bilgileri.", "icon": "search"},
        ],
    },
    "satis": {
        "slug": "satis",
        "title": "Satış ve Pazarlama Merkezi",
        "navTitle": "Satış & Pazarlama",
        "icon": "megaphone",
        "subtitle": "Satış hacmi, müşteri kazanımı ve kampanya takibi",
        "kpis": [
            {"key": "volume", "label": "Toplam Satış Hacmi (Bu Ay)", "value": "₺3.2M", "unit": "", "delta": 12.5, "deltaLabel": "+12.5%", "description": "Aylık ciro", "color": "primary"},
            {"key": "newCustomers", "label": "Yeni Müşteri Sayısı", "value": 128, "unit": "", "delta": 22, "deltaLabel": "+22", "description": "Bu ay kazanılan", "color": "success"},
            {"key": "aov", "label": "Ort. Sipariş Değeri", "value": "₺1,850", "unit": "", "delta": 4.8, "deltaLabel": "+4.8%", "description": "Sipariş başına", "color": "accent"},
            {"key": "churn", "label": "Müşteri Kayıp Oranı", "value": 2.1, "unit": "%", "delta": -0.5, "deltaLabel": "-0.5%", "description": "Aylık churn", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Pazarlama Kampanyaları",
                "statusKey": "status",
                "columns": [
                    {"key": "name", "label": "Kampanya Adı"},
                    {"key": "platform", "label": "Platform"},
                    {"key": "endDate", "label": "Bitiş Tarihi"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"name": "Yaz Sezonu İndirimleri", "platform": "Web Sitesi & Sosyal Medya", "endDate": "31.08.2023", "status": "Aktif"},
                    {"name": "Yeni Ürün Lansmanı", "platform": "E-posta & Influencer", "endDate": "15.09.2023", "status": "Planlandı"},
                    {"name": "Stok Eritme Fırsatları", "platform": "Pazaryerleri", "endDate": "20.08.2023", "status": "Tamamlandı"},
                ],
            },
        ],
        "toolsTitle": "Satış Araçları ve Raporlar",
        "tools": [
            {"title": "Detaylı Satış Analizleri", "description": "Bölge, ürün ve temsilci bazlı satış raporları.", "icon": "trending-up"},
            {"title": "Müşteri Segmentasyonu", "description": "Davranış ve değer bazlı müşteri grupları.", "icon": "pie-chart"},
            {"title": "Kampanya Yönetimi", "description": "Kampanya planlama ve performans takibi.", "icon": "megaphone"},
            {"title": "Pazar Araştırması ve Trendler", "description": "Sektör trendleri ve rakip hareketleri.", "icon": "globe"},
        ],
    },
    "envanter": {
        "slug": "envanter",
        "title": "Envanter ve Tedarik Zinciri Yönetimi",
        "navTitle": "Envanter & Tedarik Zinciri",
        "icon": "boxes",
        "subtitle": "Stok seviyeleri, tedarik süreleri ve lojistik maliyetleri",
        "kpis": [
            {"key": "turnover", "label": "Stok Devir Hızı", "value": 6.8, "unit": "kez/yıl", "delta": 0.5, "deltaLabel": "+0.5", "description": "Yıllık devir", "color": "primary"},
            {"key": "accuracy", "label": "Envanter Doğruluğu", "value": 98.9, "unit": "%", "delta": 0.2, "deltaLabel": "+0.2%", "description": "Sayım uyumu", "color": "success"},
            {"key": "leadTime", "label": "Ort. Tedarik Süresi", "value": 12.5, "unit": "gün", "delta": -1, "deltaLabel": "-1 gün", "description": "Sipariş → teslim", "color": "accent"},
            {"key": "shipping", "label": "Taşıma Maliyeti (Birim Başı)", "value": "₺12.75", "unit": "", "delta": -0.5, "deltaLabel": "-₺0.50", "description": "Birim lojistik maliyeti", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Kritik Stok Seviyeleri",
                "statusKey": "status",
                "columns": [
                    {"key": "product", "label": "Ürün Adı"},
                    {"key": "stock", "label": "Stok", "align": "right"},
                    {"key": "minStock", "label": "Min. Stok", "align": "right"},
                    {"key": "supplier", "label": "Tedarikçi"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"product": "MODEL-X Ana Kartı", "stock": 25, "minStock": 20, "supplier": "Elektronik A.Ş.", "status": "Kritik"},
                    {"product": "A-PLUS Sensör Modülü", "stock": 150, "minStock": 100, "supplier": "Sensortek Ltd.", "status": "—"},
                    {"product": "DELTA-9 Güç Ünitesi", "stock": 80, "minStock": 50, "supplier": "EnerjiMax A.Ş.", "status": "Yeterli"},
                    {"product": "OMEGA Kasa Birimi", "stock": 220, "minStock": 200, "supplier": "MetalForm San.", "status": "Yeterli"},
                ],
            },
        ],
        "toolsTitle": "Araçlar ve Raporlar",
        "tools": [
            {"title": "Detaylı Envanter Analizi", "description": "ABC analizi ve stok yaşlandırma raporları.", "icon": "bar-chart-3"},
            {"title": "Tedarikçi Performans Yönetimi", "description": "Teslimat, kalite ve fiyat skorları.", "icon": "truck"},
            {"title": "Talep Tahmini ve Planlama", "description": "Tahmin modelleri ve sipariş önerileri.", "icon": "line-chart"},
        ],
    },
    "kalite": {
        "slug": "kalite",
        "title": "Kalite Yönetim Sistemi",
        "navTitle": "Kalite Yönetimi",
        "icon": "badge-check",
        "subtitle": "Kontrol noktası performansı, hata oranları ve kalite projeleri",
        "kpis": [
            {"key": "csat", "label": "Müşteri Memnuniyet Oranı", "value": 96.5, "unit": "%", "delta": 1.2, "deltaLabel": "+1.2%", "description": "Son anket dönemi", "color": "primary"},
            {"key": "ppm", "label": "Dış Hata Oranı (PPM)", "value": 150, "unit": "ppm", "delta": -25, "deltaLabel": "-25", "description": "Milyon parçada hata", "color": "success"},
            {"key": "copq", "label": "İç Hata Maliyeti", "value": "₺85K", "unit": "", "delta": -10, "deltaLabel": "-₺10K", "description": "Bu ay", "color": "accent"},
            {"key": "projects", "label": "Tamamlanan Kalite Projeleri", "value": 18, "unit": "", "delta": 3, "deltaLabel": "+3", "description": "Yıl içinde", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Kalite Kontrol Noktaları Performansı",
                "columns": [
                    {"key": "checkpoint", "label": "Kontrol Noktası"},
                    {"key": "lastAudit", "label": "Son Denetim"},
                    {"key": "compliance", "label": "Uygunluk", "align": "right"},
                    {"key": "owner", "label": "Sorumlu"},
                ],
                "rows": [
                    {"checkpoint": "Hammadde Giriş Kontrolü", "lastAudit": "10.08.2023", "compliance": "99.5%", "owner": "A. Yılmaz"},
                    {"checkpoint": "Üretim Hattı A – Ara Kontrol", "lastAudit": "11.08.2023", "compliance": "98.2%", "owner": "B. Kaya"},
                    {"checkpoint": "Final Ürün Testi ve Sevkiyat Öncesi Kontrol", "lastAudit": "09.08.2023", "compliance": "99.8%", "owner": "C. Demir"},
                    {"checkpoint": "Paketleme ve Etiketleme Doğruluğu", "lastAudit": "10.08.2023", "compliance": "100%", "owner": "D. Can"},
                ],
            },
        ],
        "toolsTitle": "Kalite Araçları ve Raporlar",
        "tools": [
            {"title": "Uygunsuzluk Yönetimi (CAPA)", "description": "Düzeltici ve önleyici faaliyet takibi.", "icon": "shield-alert"},
            {"title": "Denetim ve Sertifikasyon", "description": "İç/dış denetim planı ve sertifika durumu.", "icon": "badge-check"},
            {"title": "İstatistiksel Süreç Kontrolü (SPC)", "description": "Kontrol kartları ve süreç yeterliliği.", "icon": "activity"},
        ],
    },
    "bakim": {
        "slug": "bakim",
        "title": "Bakım Yönetimi Merkezi",
        "navTitle": "Bakım Yönetimi",
        "icon": "wrench",
        "subtitle": "İş emirleri, arıza süreleri ve kestirimci bakım göstergeleri",
        "kpis": [
            {"key": "pmCompliance", "label": "Planlı Bakım Uyumu", "value": 92.7, "unit": "%", "delta": 2.1, "deltaLabel": "+2.1%", "description": "Planlanan / gerçekleşen", "color": "primary"},
            {"key": "mttr", "label": "Ort. Tamir Süresi (MTTR)", "value": 4.2, "unit": "saat", "delta": -0.5, "deltaLabel": "-0.5", "description": "Arıza başına", "color": "success"},
            {"key": "failures", "label": "Bu Ayki Arıza Sayısı", "value": 12, "unit": "", "delta": -3, "deltaLabel": "-3", "description": "Kayıtlı arızalar", "color": "accent"},
            {"key": "predictive", "label": "Kestirimci Bakım İsabet Oranı", "value": 78.5, "unit": "%", "delta": 5, "deltaLabel": "+5%", "description": "Doğru tahmin oranı", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Bekleyen Bakım İş Emirleri",
                "statusKey": "priority",
                "columns": [
                    {"key": "machine", "label": "Makine/Ekipman"},
                    {"key": "description", "label": "Açıklama"},
                    {"key": "priority", "label": "Öncelik"},
                    {"key": "assignee", "label": "Atanan"},
                    {"key": "plannedDate", "label": "Plan. Tarih"},
                ],
                "rows": [
                    {"machine": "CNC Torna #3", "description": "Mil yatağı ses yapıyor, kontrol gerekli.", "priority": "Yüksek", "assignee": "Bakım Ekibi A", "plannedDate": "16.08.2023"},
                    {"machine": "Pres Makinesi #1", "description": "Hidrolik sistem periyodik bakımı.", "priority": "Orta", "assignee": "M. Ali Usta", "plannedDate": "18.08.2023"},
                    {"machine": "Montaj Robotu #5", "description": "Sensör kalibrasyonu yapılacak.", "priority": "Düşük", "assignee": "Otomasyon Servisi", "plannedDate": "22.08.2023"},
                ],
            },
        ],
        "toolsTitle": "Bakım Araçları",
        "tools": [
            {"title": "Yeni İş Emri Oluştur", "description": "Arıza veya periyodik bakım için iş emri aç.", "icon": "plus-circle"},
            {"title": "Tüm İş Emirleri", "description": "Açık, devam eden ve kapanmış emirler.", "icon": "list-checks"},
            {"title": "Makine Bakım Geçmişi", "description": "Ekipman bazlı bakım ve arıza kayıtları.", "icon": "history"},
            {"title": "Kestirimci Bakım Analizleri", "description": "Sensör verisiyle arıza öngörüleri.", "icon": "brain-circuit"},
        ],
    },
    "enerji": {
        "slug": "enerji",
        "title": "Enerji ve Çevre Yönetimi",
        "navTitle": "Enerji & Çevre",
        "icon": "leaf",
        "subtitle": "Enerji tüketimi, su kullanımı ve sürdürülebilirlik metrikleri",
        "kpis": [
            {"key": "energy", "label": "Toplam Enerji Tüketimi (Bu Ay)", "value": "250,000", "unit": "kWh", "delta": -5, "deltaLabel": "-5%", "description": "Aylık toplam", "color": "primary"},
            {"key": "water", "label": "Su Kullanımı (Bu Ay)", "value": "1,200", "unit": "m³", "delta": -2, "deltaLabel": "-2%", "description": "Aylık toplam", "color": "success"},
            {"key": "carbon", "label": "Karbon Ayak İzi (Yıllık)", "value": "1,500", "unit": "tCO2e", "delta": -8, "deltaLabel": "-8%", "description": "Yıllık emisyon", "color": "accent"},
            {"key": "recycling", "label": "Atık Geri Dönüşüm Oranı", "value": 75, "unit": "%", "delta": 10, "deltaLabel": "+10%", "description": "Geri kazanılan atık", "color": "warning"},
        ],
        "sections": [
            {
                "type": "progress",
                "title": "Enerji Tüketim Dağılımı (Aylık)",
                "items": [
                    {"label": "Üretim Makineleri", "value": 65, "color": "primary"},
                    {"label": "Aydınlatma", "value": 15, "color": "warning"},
                    {"label": "HVAC Sistemleri", "value": 12, "color": "success"},
                    {"label": "Ofis Ekipmanları", "value": 5, "color": "lavender"},
                    {"label": "Diğer", "value": 3, "color": "muted"},
                ],
            },
        ],
        "toolsTitle": "Araçlar ve Raporlar",
        "tools": [
            {"title": "Detaylı Enerji Analizi", "description": "Makine ve vardiya bazlı tüketim kırılımı.", "icon": "zap"},
            {"title": "Çevre Uygunluk Raporları", "description": "Mevzuat ve emisyon uyum raporları.", "icon": "file-check"},
            {"title": "Sürdürülebilirlik Projeleri", "description": "Enerji verimliliği ve karbon azaltım projeleri.", "icon": "leaf"},
            {"title": "Risk ve Uyarı Yönetimi", "description": "Eşik aşımı uyarıları ve risk kayıtları.", "icon": "bell-ring"},
        ],
    },
    "stratejik": {
        "slug": "stratejik",
        "title": "Stratejik Analizler ve Öngörüler",
        "navTitle": "Stratejik Analizler",
        "icon": "compass",
        "subtitle": "Pazar konumu, risk puanı ve SWOT özeti",
        "kpis": [
            {"key": "marketShare", "label": "Pazar Payı Değişimi (Yıllık)", "value": "+2.5%", "unit": "", "delta": 2.5, "deltaLabel": "+2.5%", "description": "Yıllık değişim", "color": "primary"},
            {"key": "npd", "label": "Yeni Ürün Başarı Oranı", "value": 65, "unit": "%", "delta": 10, "deltaLabel": "+10%", "description": "Hedefi tutan lansmanlar", "color": "success"},
            {"key": "risk", "label": "Genel Risk Puanı", "value": "4.2/10", "unit": "", "delta": -0.8, "deltaLabel": "-0.8", "description": "Düşük daha iyi", "color": "accent"},
            {"key": "competition", "label": "Rekabet Yoğunluk Endeksi", "value": "Yüksek", "unit": "", "delta": 0, "deltaLabel": "", "description": "Sektör ortalamasının üzerinde", "color": "warning"},
        ],
        "sections": [
            {
                "type": "swot",
                "title": "SWOT Analizi Özeti",
                "strengths": ["Güçlü marka bilinirliği", "Yenilikçi ürün portföyü", "Deneyimli yönetim ekibi", "Yüksek üretim kapasitesi"],
                "weaknesses": ["Bazı pazarlarda sınırlı dağıtım ağı", "Yüksek hammadde bağımlılığı", "Dijital pazarlamada gelişme ihtiyacı"],
                "opportunities": ["Yeni gelişen pazarlara açılma", "E-ticaret kanalını güçlendirme", "Sürdürülebilir üretim teknolojileri", "Stratejik ortaklıklar"],
                "threats": ["Artan rekabet baskısı", "Hammadde fiyatlarındaki dalgalanmalar", "Değişen tüketici tercihleri", "Ekonomik belirsizlikler"],
            },
        ],
        "toolsTitle": "Strateji Araçları",
        "tools": [
            {"title": "Rekabet Analizi Detayları", "description": "Rakip karşılaştırmaları ve konumlandırma.", "icon": "swords"},
            {"title": "Senaryo Planlama ve Simülasyon", "description": "Talep ve maliyet senaryoları.", "icon": "git-branch"},
            {"title": "Pazar Fırsatları ve Risk Değerlendirme", "description": "Fırsat matrisi ve risk kayıt defteri.", "icon": "radar"},
        ],
    },
}

# v2 expansion (SPEC §8): 14 additional modules, groups, notifications, audit log
from app.data.seed_v2 import (  # noqa: E402
    AUDIT_LOG,
    LIVE_INITIAL,
    MODULE_GROUPS as _GROUPS_V2,
    MODULES_V2,
    NOTIFICATIONS,
)

# v3 expansion: 16 more modules (Üretim Zekâsı, Finans & Yatırım, Kurumsal)
from app.data.seed_v3 import MODULE_GROUPS_V3 as _GROUPS_V3, MODULES_V3  # noqa: E402

MODULE_GROUPS: list[tuple[str, list[str]]] = [*_GROUPS_V2, *_GROUPS_V3]
MODULE_GROUP_OF: dict[str, str] = {slug: group for group, slugs in MODULE_GROUPS for slug in slugs}

MODULES.update(MODULES_V2)
MODULES.update(MODULES_V3)
for _slug, _module in MODULES.items():
    _module["group"] = MODULE_GROUP_OF.get(_slug, "Fabrika Yönetimi")

MODULE_SLUGS = list(MODULES.keys())

# ---------------------------------------------------------------------------
# 4.12 Analytics datasets
# ---------------------------------------------------------------------------
ANALYTICS_DATASETS = [
    {"id": "uretim", "name": "Üretim", "description": "Günlük üretim adedi, OEE ve duruş süreleri", "metrics": ["Üretim Adedi", "OEE", "Duruş (saat)", "Fire Oranı"]},
    {"id": "satis", "name": "Satış", "description": "Günlük ciro, sipariş sayısı ve ortalama sepet", "metrics": ["Ciro (₺K)", "Sipariş Sayısı", "Ort. Sipariş (₺)", "Yeni Müşteri"]},
    {"id": "kalite", "name": "Kalite", "description": "Hata oranları, iade ve denetim skorları", "metrics": ["Hata Oranı (%)", "PPM", "İade Adedi", "Denetim Skoru"]},
    {"id": "enerji", "name": "Enerji", "description": "Enerji ve su tüketimi ile karbon emisyonu", "metrics": ["Enerji (kWh)", "Su (m³)", "Karbon (kg)", "Verimlilik (%)"]},
]

# base level, daily noise std, weekly trend, weekend factor
ANALYTICS_PROFILES = {
    "uretim": {"Üretim Adedi": (580, 45, 0.6, 0.55), "OEE": (82.5, 3.0, 0.02, 0.95), "Duruş (saat)": (2.4, 0.8, -0.005, 1.1), "Fire Oranı": (1.8, 0.4, -0.003, 1.05)},
    "satis": {"Ciro (₺K)": (105, 14, 0.25, 0.8), "Sipariş Sayışı": None, "Sipariş Sayısı": (58, 9, 0.12, 0.8), "Ort. Sipariş (₺)": (1850, 120, 0.9, 1.0), "Yeni Müşteri": (4.2, 1.8, 0.01, 0.6)},
    "kalite": {"Hata Oranı (%)": (0.85, 0.2, -0.002, 1.0), "PPM": (160, 22, -0.15, 1.0), "İade Adedi": (6, 2.5, -0.01, 0.7), "Denetim Skoru": (97.5, 1.2, 0.01, 1.0)},
    "enerji": {"Enerji (kWh)": (8300, 520, -3.0, 0.6), "Su (m³)": (40, 5, -0.02, 0.65), "Karbon (kg)": (4100, 260, -1.8, 0.6), "Verimlilik (%)": (87.5, 2.2, 0.03, 1.0)},
}
# drop the typo guard key
ANALYTICS_PROFILES["satis"].pop("Sipariş Sayışı", None)

# ---------------------------------------------------------------------------
# 4.13 Scenario presets
# ---------------------------------------------------------------------------
SCENARIO_BASE = {
    "units": 17450,          # monthly production units
    "unitPrice": 183.4,      # ₺ per unit (→ ~₺3.2M revenue)
    "materialCostPerUnit": 48.7,
    "energyCostPerUnit": 14.3,
    "laborCostPerShift": 265000.0,
    "fixedCost": 450000.0,
    "shifts": 2,
}

SCENARIO_PRESETS = [
    {"id": "iyimser", "name": "İyimser", "description": "Talep artıyor, maliyetler geriliyor", "params": {"demandChange": 15, "materialPriceChange": -5, "shifts": 3, "energyPriceChange": -3}},
    {"id": "baz", "name": "Baz", "description": "Mevcut koşullar sürüyor", "params": {"demandChange": 0, "materialPriceChange": 0, "shifts": 2, "energyPriceChange": 0}},
    {"id": "kotumser", "name": "Kötümser", "description": "Talep düşüyor, girdi fiyatları artıyor", "params": {"demandChange": -12, "materialPriceChange": 12, "shifts": 2, "energyPriceChange": 18}},
]

# ---------------------------------------------------------------------------
# 4.14 Locations
# ---------------------------------------------------------------------------
LOCATIONS = [
    {"id": "ist", "name": "İstanbul Merkez Ofis", "region": "Marmara", "type": "Ofis", "performance": "high", "performanceLabel": "Yüksek", "value": 4250000, "trend": 12, "lat": 41.01, "lng": 28.98},
    {"id": "ank", "name": "Ankara Şube", "region": "İç Anadolu", "type": "Şube", "performance": "medium", "performanceLabel": "Orta", "value": 2750000, "trend": 5, "lat": 39.93, "lng": 32.86},
    {"id": "izm", "name": "İzmir Fabrika", "region": "Ege", "type": "Fabrika", "performance": "high", "performanceLabel": "Yüksek", "value": 5100000, "trend": 8, "lat": 38.42, "lng": 27.14},
    {"id": "brs", "name": "Bursa Üretim Tesisi", "region": "Marmara", "type": "Fabrika", "performance": "medium", "performanceLabel": "Orta", "value": 2400000, "trend": 3, "lat": 40.19, "lng": 29.06},
    {"id": "ant", "name": "Antalya Depo", "region": "Akdeniz", "type": "Depo", "performance": "low", "performanceLabel": "Düşük", "value": 600000, "trend": -2, "lat": 36.90, "lng": 30.70},
    {"id": "gzt", "name": "Gaziantep Şube", "region": "Güneydoğu", "type": "Şube", "performance": "medium", "performanceLabel": "Orta", "value": 1000000, "trend": 1, "lat": 37.07, "lng": 37.38},
]

for _loc in LOCATIONS:
    _loc["trendLabel"] = f"{_loc['trend']:+d}%"

# ---------------------------------------------------------------------------
# 4.15 Widgets
# ---------------------------------------------------------------------------
WIDGETS = [
    {"id": "w1", "title": "Gelir Gider Grafiği", "type": "Grafik", "typeKey": "chart", "size": "Geniş", "sizeKey": "wide", "enabled": True, "order": 1},
    {"id": "w2", "title": "Müşteri Dağılımı", "type": "Pasta", "typeKey": "pie", "size": "Dar", "sizeKey": "narrow", "enabled": True, "order": 2},
    {"id": "w3", "title": "Satış Tablosu", "type": "Tablo", "typeKey": "table", "size": "Orta", "sizeKey": "medium", "enabled": True, "order": 3},
]

AVAILABLE_WIDGETS = [
    {"id": "aw1", "title": "Bölge Performansı", "type": "Grafik", "typeKey": "chart", "size": "Orta", "sizeKey": "medium", "description": "Bölge bazlı satış ve hedef karşılaştırması"},
    {"id": "aw2", "title": "Departman Bazlı Performans", "type": "Grafik", "typeKey": "chart", "size": "Geniş", "sizeKey": "wide", "description": "Departmanların KPI gerçekleşmeleri"},
    {"id": "aw3", "title": "Stok Düzeyi", "type": "Tablo", "typeKey": "table", "size": "Dar", "sizeKey": "narrow", "description": "Kritik ürünlerin anlık stok durumu"},
    {"id": "aw4", "title": "Hedef Gerçekleşme", "type": "Gösterge", "typeKey": "gauge", "size": "Dar", "sizeKey": "narrow", "description": "Aylık hedefe ulaşma yüzdesi"},
]

# ---------------------------------------------------------------------------
# 4.16 Theme
# ---------------------------------------------------------------------------
THEME_DEFAULT = {
    "activePreset": "koyu",
    "colors": [
        {"key": "primary", "label": "Ana Renk", "description": "Butonlar, aktif menü ve vurgular", "value": "#c4b28d"},
        {"key": "secondary", "label": "İkincil Renk", "description": "İkincil vurgular ve grafik serileri", "value": "#7f9fcf"},
        {"key": "accent", "label": "Vurgu Rengi", "description": "Dikkat çekici öğeler", "value": "#c8875a"},
        {"key": "success", "label": "Başarı", "description": "Olumlu durum ve artışlar", "value": "#7fb28a"},
        {"key": "warning", "label": "Uyarı", "description": "Dikkat gerektiren durumlar", "value": "#d9b86a"},
        {"key": "danger", "label": "Hata", "description": "Hata ve kritik durumlar", "value": "#c96b6b"},
        {"key": "background", "label": "Arka Plan", "description": "Sayfa arka planı", "value": "#0b1528"},
        {"key": "card", "label": "Kart Arka Planı", "description": "Kart ve panel yüzeyleri", "value": "#172b4d"},
        {"key": "text", "label": "Metin Rengi", "description": "Ana metin rengi", "value": "#f6f1e7"},
    ],
    "presets": [
        {"id": "koyu", "name": "Koyu Tema", "swatches": ["#0b1528", "#172b4d", "#c4b28d"]},
        {"id": "aydin", "name": "Aydın Tema", "swatches": ["#f6f1e7", "#ece3d1", "#172b4d"]},
        {"id": "mavi", "name": "Mavi Tema", "swatches": ["#0b1528", "#7f9fcf", "#f6f1e7"]},
    ],
    "schemes": [
        {"id": "mavi", "name": "Mavi Tema", "primary": "#7f9fcf"},
        {"id": "yesil", "name": "Yeşil Tema", "primary": "#8fa98a"},
        {"id": "mor", "name": "Mor Tema", "primary": "#9b8fbf"},
        {"id": "kirmizi", "name": "Kırmızı Tema", "primary": "#b8707a"},
    ],
}

# ---------------------------------------------------------------------------
# 4.17 Users & roles
# ---------------------------------------------------------------------------
USERS = [
    {"id": "u1", "name": "Ahmet Yılmaz", "email": "ahmet@ornek.com", "role": "Admin", "status": "Aktif", "lastLogin": "2 saat önce"},
    {"id": "u2", "name": "Ayşe Demir", "email": "ayse@ornek.com", "role": "Yönetici", "status": "Aktif", "lastLogin": "1 gün önce"},
    {"id": "u3", "name": "Mehmet Kaya", "email": "mehmet@ornek.com", "role": "Analist", "status": "Aktif", "lastLogin": "3 saat önce"},
    {"id": "u4", "name": "Zeynep Şahin", "email": "zeynep@ornek.com", "role": "Gözlemci", "status": "Aktif", "lastLogin": "5 gün önce"},
    {"id": "u5", "name": "Ali Yıldız", "email": "ali@ornek.com", "role": "Yönetici", "status": "Pasif", "lastLogin": "30 gün önce"},
]

ROLE_MODULES = [
    {"slug": "dashboard", "title": "Genel Dashboard"},
    *[{"slug": s, "title": MODULES[s]["navTitle"]} for s in MODULE_SLUGS],
    {"slug": "analiz", "title": "Detaylı Analiz"},
    {"slug": "senaryo", "title": "Senaryo Analizi"},
    {"slug": "harita", "title": "Harita Entegrasyonu"},
    {"slug": "yetki", "title": "Yetki Yönetimi"},
    {"slug": "rapor", "title": "Rapor Oluşturma"},
    {"slug": "eposta", "title": "E-posta Gönderimi"},
    {"slug": "veri-kaynaklari", "title": "Veri Kaynakları"},
]


def _perm(view: bool, edit: bool, delete: bool) -> dict:
    return {"view": view, "edit": edit, "delete": delete}


ROLES = [
    {
        "id": "admin", "name": "Admin", "color": "danger", "description": "Tüm modüllerde tam yetki",
        "userCount": 1,
        "permissions": {m["slug"]: _perm(True, True, True) for m in ROLE_MODULES},
    },
    {
        "id": "yonetici", "name": "Yönetici", "color": "info", "description": "Operasyonel modüllerde düzenleme yetkisi",
        "userCount": 2,
        "permissions": {m["slug"]: _perm(True, m["slug"] not in ("yetki",), False) for m in ROLE_MODULES},
    },
    {
        "id": "analist", "name": "Analist", "color": "secondary", "description": "Analiz ve rapor araçlarında düzenleme, diğerlerinde görüntüleme",
        "userCount": 1,
        "permissions": {m["slug"]: _perm(m["slug"] != "yetki", m["slug"] in ("analiz", "senaryo", "rapor", "veri-kaynaklari"), False) for m in ROLE_MODULES},
    },
    {
        "id": "gozlemci", "name": "Gözlemci", "color": "muted", "description": "Yalnızca görüntüleme",
        "userCount": 1,
        "permissions": {m["slug"]: _perm(m["slug"] not in ("yetki", "veri-kaynaklari"), False, False) for m in ROLE_MODULES},
    },
]

# ---------------------------------------------------------------------------
# 4.18 Reports
# ---------------------------------------------------------------------------
REPORT_CHART_OPTIONS = [
    {"id": "aylik-satis", "name": "Aylık Satışlar"},
    {"id": "bolge-satis", "name": "Bölge Bazlı Satışlar"},
    {"id": "kategori-satis", "name": "Kategori Bazlı Satışlar"},
]

REPORT_TABLE_OPTIONS = [
    {"id": "kategori", "name": "Ürün Kategorisi Satışları"},
    {"id": "bolge", "name": "Bölge Satışları"},
]

REPORT_CHART_DATA = {
    "aylik-satis": {"xKey": "month", "yKeys": ["Satış"], "data": [
        {"month": "Oca", "Satış": 1.62}, {"month": "Şub", "Satış": 1.71}, {"month": "Mar", "Satış": 1.88},
        {"month": "Nis", "Satış": 1.95}, {"month": "May", "Satış": 2.10}, {"month": "Haz", "Satış": 2.02},
    ]},
    "bolge-satis": {"xKey": "region", "yKeys": ["Satış"], "data": [
        {"region": "Marmara", "Satış": 0.84}, {"region": "Ege", "Satış": 0.46}, {"region": "İç Anadolu", "Satış": 0.38},
        {"region": "Akdeniz", "Satış": 0.22}, {"region": "Güneydoğu", "Satış": 0.20},
    ]},
    "kategori-satis": {"xKey": "category", "yKeys": ["Satış"], "data": [
        {"category": "Elektronik", "Satış": 0.72}, {"category": "Mekanik", "Satış": 0.58}, {"category": "Yedek Parça", "Satış": 0.41},
        {"category": "Hizmet", "Satış": 0.39},
    ]},
}

REPORT_TABLE_DATA = {
    "kategori": {
        "columns": [
            {"key": "category", "label": "Kategori"},
            {"key": "sales", "label": "Satış", "align": "right"},
            {"key": "growth", "label": "Büyüme", "align": "right"},
            {"key": "status", "label": "Durum"},
        ],
        "rows": [
            {"category": "Elektronik", "sales": "₺720K", "growth": "+14.2%", "status": "Yüksek"},
            {"category": "Mekanik", "sales": "₺580K", "growth": "+6.8%", "status": "Orta"},
            {"category": "Yedek Parça", "sales": "₺410K", "growth": "+2.1%", "status": "Orta"},
            {"category": "Hizmet", "sales": "₺390K", "growth": "-1.5%", "status": "Düşük"},
        ],
    },
    "bolge": {
        "columns": [
            {"key": "region", "label": "Bölge"},
            {"key": "sales", "label": "Satış", "align": "right"},
            {"key": "growth", "label": "Büyüme", "align": "right"},
            {"key": "status", "label": "Durum"},
        ],
        "rows": [
            {"region": "Marmara", "sales": "₺840K", "growth": "+12.0%", "status": "Yüksek"},
            {"region": "Ege", "sales": "₺460K", "growth": "+8.0%", "status": "Yüksek"},
            {"region": "İç Anadolu", "sales": "₺380K", "growth": "+5.0%", "status": "Orta"},
            {"region": "Akdeniz", "sales": "₺220K", "growth": "-2.0%", "status": "Düşük"},
            {"region": "Güneydoğu", "sales": "₺200K", "growth": "+1.0%", "status": "Orta"},
        ],
    },
}

REPORTS = [
    {
        "id": "r1",
        "name": "Aylık Satış Raporu – Mayıs 2023",
        "type": "Özet Rapor",
        "description": "Mayıs 2023 satış performansı özeti",
        "createdAt": "2023-06-01T09:00:00",
        "updatedAt": "2023-06-01T09:00:00",
        "components": [
            {"id": "c1", "type": "title", "label": "Rapor Başlığı", "content": "Aylık Satış Raporu – Mayıs 2023"},
            {"id": "c2", "type": "text", "label": "Giriş Metni", "content": "Bu rapor, Mayıs 2023 ayına ait satış verilerini içermektedir. Raporda bölge bazlı satış performansı, ürün kategorisi bazında satışlar ve geçen yıl verileri ile karşılaştırmalar yer almaktadır."},
            {"id": "c3", "type": "chart", "label": "Satış Grafiği", "source": "aylik-satis", "chartType": "bar"},
            {"id": "c4", "type": "table", "label": "Ürün Kategorisi Satışları", "source": "kategori"},
        ],
    },
    {
        "id": "r2",
        "name": "Haftalık Performans Özeti",
        "type": "Performans Raporu",
        "description": "Üretim hatlarının haftalık OEE ve duruş özeti",
        "createdAt": "2023-06-05T08:30:00",
        "updatedAt": "2023-06-05T08:30:00",
        "components": [
            {"id": "c1", "type": "title", "label": "Rapor Başlığı", "content": "Haftalık Performans Özeti"},
            {"id": "c2", "type": "text", "label": "Giriş Metni", "content": "Bu özet, üretim hatlarının son haftaya ait OEE, plan gerçekleşme ve duruş verilerini içermektedir."},
            {"id": "c3", "type": "chart", "label": "Bölge Grafiği", "source": "bolge-satis", "chartType": "bar"},
        ],
    },
    {
        "id": "r3",
        "name": "Finansal Özet",
        "type": "Özet Rapor",
        "description": "Aylık gelir-gider ve kâr marjı özeti",
        "createdAt": "2023-06-02T10:15:00",
        "updatedAt": "2023-06-02T10:15:00",
        "components": [
            {"id": "c1", "type": "title", "label": "Rapor Başlığı", "content": "Finansal Özet"},
            {"id": "c2", "type": "table", "label": "Bölge Satışları", "source": "bolge"},
        ],
    },
    {
        "id": "r4",
        "name": "Müşteri Analizi",
        "type": "Detaylı Rapor",
        "description": "Müşteri segmentleri ve kayıp oranı analizi",
        "createdAt": "2023-04-10T11:00:00",
        "updatedAt": "2023-04-10T11:00:00",
        "components": [
            {"id": "c1", "type": "title", "label": "Rapor Başlığı", "content": "Müşteri Analizi"},
            {"id": "c2", "type": "text", "label": "Giriş Metni", "content": "Müşteri segmentlerinin satış katkısı ve kayıp oranı eğilimleri bu raporda özetlenmektedir."},
            {"id": "c3", "type": "chart", "label": "Kategori Grafiği", "source": "kategori-satis", "chartType": "bar"},
        ],
    },
]

REPORT_TYPES = ["Özet Rapor", "Detaylı Rapor", "Performans Raporu", "Finansal Rapor"]

# ---------------------------------------------------------------------------
# 4.19 Emails
# ---------------------------------------------------------------------------
EMAILS = [
    {
        "id": "e1",
        "subject": "Haftalık Satış Raporu",
        "recipients": ["Yönetim Ekibi", "Satış Ekibi"],
        "reports": ["Aylık Satış Raporu", "Haftalık Performans Özeti"],
        "reportIds": ["r1", "r2"],
        "schedule": "Her Pazartesi 09:00",
        "lastSent": "24.04.2023",
        "status": "Aktif",
    },
    {
        "id": "e2",
        "subject": "Aylık Performans Değerlendirmesi",
        "recipients": ["Yönetim Ekibi", "Pazarlama Ekibi", "İK Ekibi"],
        "reports": ["Haftalık Performans Özeti", "Finansal Özet"],
        "reportIds": ["r2", "r3"],
        "schedule": "Her ayın 1. günü 10:00",
        "lastSent": "01.05.2023",
        "status": "Aktif",
    },
    {
        "id": "e3",
        "subject": "Müşteri Analiz Raporu",
        "recipients": ["Yönetim Ekibi", "Satış Ekibi", "Pazarlama Ekibi"],
        "reports": ["Müşteri Analizi"],
        "reportIds": ["r4"],
        "schedule": "Her ayın 15. günü 14:00",
        "lastSent": "15.04.2023",
        "status": "Pasif",
    },
]

RECIPIENT_GROUPS = [
    {"id": "yonetim", "name": "Yönetim Ekibi", "email": "yonetim@ornek.com"},
    {"id": "satis", "name": "Satış Ekibi", "email": "satis@ornek.com"},
    {"id": "pazarlama", "name": "Pazarlama Ekibi", "email": "pazarlama@ornek.com"},
    {"id": "ik", "name": "İK Ekibi", "email": "ik@ornek.com"},
    {"id": "finans", "name": "Finans Ekibi", "email": "finans@ornek.com"},
]

# ---------------------------------------------------------------------------
# 4.20 Data sources
# ---------------------------------------------------------------------------
DATASOURCES = [
    {"id": "ds1", "name": "CRM Veritabanı", "type": "Veritabanı", "typeKey": "database", "connection": "mssql://user:****@crm-server/crm_db", "rows": "1,250,000+", "size": "4.5 GB", "lastUpdated": "2 saat önce", "status": "Bağlı", "connected": True, "uploaded": False},
    {"id": "ds2", "name": "Satış Verileri", "type": "Excel Dosyası", "typeKey": "excel", "connection": "/data/satis_verileri_2023.xlsx", "rows": "45,800", "size": "12 MB", "lastUpdated": "1 gün önce", "status": "Bağlı", "connected": True, "uploaded": False},
    {"id": "ds3", "name": "Müşteri API", "type": "API / Web Servisi", "typeKey": "api", "connection": "https://api.example.com/customers", "rows": "350,000+", "size": "N/A", "lastUpdated": "30 dk önce", "status": "Bağlı", "connected": True, "uploaded": False},
    {"id": "ds4", "name": "Ürün Kataloğu", "type": "Dosya Yükleme", "typeKey": "upload", "connection": "/data/urun_katalogu.csv", "rows": "25,000", "size": "8 MB", "lastUpdated": "5 gün önce", "status": "Bağlantı Yok", "connected": False, "uploaded": False},
]

DATASOURCE_TYPES = [
    {"key": "database", "label": "Veritabanı"},
    {"key": "excel", "label": "Excel Dosyası"},
    {"key": "csv", "label": "CSV Dosyası"},
    {"key": "api", "label": "API / Web Servisi"},
]

CHAT_WELCOME = (
    "Merhaba! Ben Veri Analizi Asistanı. Varsayılan olarak 1.470 çalışanlık personel veri setini (Türkçe) analiz ederim; "
    "kendi CSV/Excel dosyanızı yükleyerek de soru sorabilirsiniz. Örneğin:\n"
    "• \"Departmanlara göre ortalama maaşları göster\"\n"
    "• \"Yaş dağılımı histogramını çiz\"\n"
    "• \"En yüksek maaşı alan 5 kişiyi listele\""
)
