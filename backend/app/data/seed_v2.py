# -*- coding: utf-8 -*-
"""v2 expansion data (docs/SPEC.md §8): 14 new modules, module groups,
notifications and audit log seed. Merged into ``seed.MODULES`` at import."""

from __future__ import annotations

_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
_LAST6 = ["Nis", "May", "Haz", "Tem", "Ağu", "Eyl"]

# ---------------------------------------------------------------------------
# Module groups (sidebar) – order matters
# ---------------------------------------------------------------------------
MODULE_GROUPS: list[tuple[str, list[str]]] = [
    ("Fabrika Yönetimi", ["finans", "uretim", "insan-kaynaklari", "satis", "envanter", "kalite", "bakim", "enerji", "stratejik"]),
    ("Tedarik & Lojistik", ["stok", "satin-alma", "tedarikciler", "lojistik"]),
    ("Müşteri & İnsan", ["musteriler", "vardiya", "isg"]),
    ("Varlık & Zekâ", ["varliklar", "tahmin", "hedefler"]),
    ("Yönetişim", ["uyarilar", "denetim", "belgeler", "entegrasyonlar"]),
]

MODULE_GROUP_OF: dict[str, str] = {slug: group for group, slugs in MODULE_GROUPS for slug in slugs}

# ---------------------------------------------------------------------------
# Chart helpers
# ---------------------------------------------------------------------------
_STOK_CHART = [
    {"month": m, "Ana Depo A": a, "Hammadde Deposu": h, "Yarı Mamul": y}
    for m, a, h, y in zip(_LAST6, [18.2, 18.9, 19.6, 19.1, 20.4, 21.0], [14.5, 15.1, 14.8, 15.6, 16.2, 16.4], [9.8, 10.2, 10.6, 10.1, 10.9, 11.2])
]

_SATINALMA_CHART = [
    {"month": m, "Hammadde": a, "Yardımcı Malzeme": b, "Hizmet": c}
    for m, a, b, c in zip(_LAST6, [4.1, 4.4, 4.2, 4.8, 5.1, 4.9], [1.2, 1.1, 1.3, 1.4, 1.3, 1.5], [0.8, 0.9, 0.8, 1.0, 1.1, 1.0])
]

_TEDARIKCI_CHART = [
    {"month": m, "Ret PPM": v} for m, v in zip(_LAST6, [1420, 1310, 1180, 1050, 960, 890])
]

_LOJISTIK_CHART = [
    {"week": f"H{w}", "Planlanan": p, "Gerçekleşen": g}
    for w, p, g in zip(range(31, 39), [186, 192, 178, 204, 198, 210, 215, 208], [181, 190, 171, 199, 196, 204, 212, 201])
]

_MUSTERI_CHART = [
    {"month": m, "Yeni Müşteri": n, "Kaybedilen": c}
    for m, n, c in zip(_LAST6, [6, 8, 5, 9, 7, 11], [2, 1, 3, 1, 2, 1])
]

_VARDIYA_CHART = [
    {"day": d, "Sabah": s, "Öğle": o, "Gece": g}
    for d, s, o, g in zip(["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"], [48, 52, 44, 61, 58, 72, 35], [40, 46, 38, 52, 49, 64, 30], [62, 58, 66, 71, 69, 80, 44])
]

_ISG_CHART = [
    {"month": m, "Kaza": k, "Ramak Kala": r}
    for m, k, r in zip(_LAST6, [2, 1, 1, 0, 1, 0], [9, 12, 8, 14, 11, 13])
]

_VARLIK_CHART = [
    {"month": m, "CNC Hattı": c, "Pres Hattı": p, "Montaj": mo}
    for m, c, p, mo in zip(_LAST6, [88, 87, 85, 86, 84, 83], [91, 90, 92, 91, 90, 89], [93, 94, 92, 93, 94, 95])
]

_ACTUAL = [2180, 2240, 2310, 2290, 2420, 2510, 2460, 2530, 2610, None, None, None]
_FORECAST = [None, None, None, None, None, None, None, None, 2610, 2680, 2750, 2890]
_TAHMIN_CHART = [
    {
        "month": m,
        "Gerçek": a,
        "Tahmin": f,
        "Alt Bant": (round(f * 0.94) if f is not None else None),
        "Üst Bant": (round(f * 1.06) if f is not None else None),
    }
    for m, a, f in zip(_MONTHS, _ACTUAL, _FORECAST)
]

_UYARI_CHART = [
    {"day": d, "Kritik": k, "Uyarı": u, "Bilgi": b}
    for d, k, u, b in zip(["15 Eyl", "16 Eyl", "17 Eyl", "18 Eyl", "19 Eyl", "20 Eyl", "21 Eyl"], [1, 0, 2, 1, 0, 1, 3], [6, 8, 5, 9, 7, 4, 11], [14, 12, 17, 15, 13, 9, 18])
]

_DENETIM_CHART = [
    {"hour": f"{h:02d}:00", "Olay": v}
    for h, v in zip(range(0, 24, 3), [42, 31, 118, 296, 342, 287, 198, 96])
]

_ENTEGRASYON_CHART = [
    {"hour": f"{h:02d}:00", "SAP": s, "MES": m, "IoT Hub": i}
    for h, s, m, i in zip(range(0, 24, 3), [12, 9, 38, 64, 71, 58, 44, 21], [28, 26, 52, 61, 66, 63, 49, 30], [88, 86, 91, 95, 97, 96, 92, 89])
]

# ---------------------------------------------------------------------------
# 14 new modules
# ---------------------------------------------------------------------------
MODULES_V2: dict[str, dict] = {
    # ------------------------------------------------------------- Tedarik & Lojistik
    "stok": {
        "slug": "stok",
        "title": "Stok Yönetimi",
        "navTitle": "Stok Yönetimi",
        "icon": "warehouse",
        "subtitle": "Depo bazlı stok seviyeleri, ABC sınıflandırması ve kritik SKU takibi",
        "kpis": [
            {"key": "stockValue", "label": "Toplam Stok Değeri", "value": "₺48.6M", "unit": "", "delta": 3.4, "deltaLabel": "+3.4%", "description": "Tüm depolar, maliyet bazlı", "color": "primary"},
            {"key": "criticalSku", "label": "Kritik SKU Sayısı", "value": 14, "unit": "", "delta": -3, "deltaLabel": "-3", "description": "Min. seviyenin altında", "color": "warning"},
            {"key": "accuracy", "label": "Stok Doğruluğu", "value": 99.2, "unit": "%", "delta": 0.3, "deltaLabel": "+0.3%", "description": "Döngüsel sayım uyumu", "color": "success"},
            {"key": "deadStock", "label": "Ölü Stok Oranı", "value": 2.8, "unit": "%", "delta": -0.6, "deltaLabel": "-0.6%", "description": "180+ gün hareketsiz", "color": "accent"},
        ],
        "sections": [
            {
                "type": "progress",
                "title": "ABC Analizi – Değer Payı",
                "items": [
                    {"label": "A Sınıfı (142 SKU)", "value": 68, "color": "primary"},
                    {"label": "B Sınıfı (386 SKU)", "value": 22, "color": "secondary"},
                    {"label": "C Sınıfı (1,214 SKU)", "value": 10, "color": "muted"},
                ],
            },
            {
                "type": "table",
                "title": "Kritik Stok Seviyesindeki SKU'lar",
                "statusKey": "status",
                "columns": [
                    {"key": "sku", "label": "SKU"},
                    {"key": "product", "label": "Ürün"},
                    {"key": "depot", "label": "Depo"},
                    {"key": "stock", "label": "Stok", "align": "right"},
                    {"key": "minStock", "label": "Min.", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"sku": "MX-4471", "product": "Servo Sürücü 2.2 kW", "depot": "Ana Depo A", "stock": 18, "minStock": 40, "status": "Kritik"},
                    {"sku": "HM-0932", "product": "Alüminyum Profil 40x40", "depot": "Hammadde Deposu", "stock": 320, "minStock": 500, "status": "Kritik"},
                    {"sku": "EL-2205", "product": "PLC Giriş Modülü 16DI", "depot": "Elektronik Rafı B2", "stock": 9, "minStock": 12, "status": "Düşük"},
                    {"sku": "RB-7718", "product": "Konveyör Bandı 600 mm", "depot": "Ana Depo A", "stock": 4, "minStock": 6, "status": "Düşük"},
                    {"sku": "KM-1150", "product": "Hidrolik Yağ ISO VG 46", "depot": "Kimyasal Deposu", "stock": 1200, "minStock": 1000, "status": "Yeterli"},
                    {"sku": "YM-3308", "product": "Kaynaklı Şase Yarı Mamul", "depot": "Yarı Mamul Sahası", "stock": 86, "minStock": 60, "status": "Yeterli"},
                ],
            },
            {
                "type": "chart",
                "title": "Depo Bazlı Stok Seviyesi (₺M, 6 Ay)",
                "chartType": "area",
                "unit": "₺M",
                "data": _STOK_CHART,
                "xKey": "month",
                "yKeys": ["Ana Depo A", "Hammadde Deposu", "Yarı Mamul"],
            },
        ],
        "toolsTitle": "Stok Araçları",
        "tools": [
            {"title": "Döngüsel Sayım Planı", "description": "Depo ve raf bazlı sayım takvimi, fark raporları.", "icon": "clipboard-list"},
            {"title": "Yeniden Sipariş Noktası", "description": "SKU bazlı min/max ve emniyet stoğu hesapları.", "icon": "refresh-cw"},
            {"title": "Depo Yerleşim Haritası", "description": "Raf doluluk ve adres yönetimi.", "icon": "map"},
            {"title": "Stok Yaşlandırma Raporu", "description": "Hareketsiz ve yavaş dönen kalemler.", "icon": "hourglass"},
        ],
    },
    "satin-alma": {
        "slug": "satin-alma",
        "title": "Satın Alma",
        "navTitle": "Satın Alma",
        "icon": "shopping-cart",
        "subtitle": "Talep, sipariş ve onay akışlarının uçtan uca takibi",
        "kpis": [
            {"key": "openPo", "label": "Açık Sipariş Tutarı", "value": "₺6.4M", "unit": "", "delta": 8.1, "deltaLabel": "+8.1%", "description": "Teslim bekleyen 37 sipariş", "color": "primary"},
            {"key": "approval", "label": "Ort. Onay Süresi", "value": 1.8, "unit": "gün", "delta": -0.4, "deltaLabel": "-0.4 gün", "description": "Talep → onaylı sipariş", "color": "success"},
            {"key": "otd", "label": "Zamanında Teslim Oranı", "value": 94.1, "unit": "%", "delta": 1.2, "deltaLabel": "+1.2%", "description": "Son 90 gün", "color": "accent"},
            {"key": "savings", "label": "Tasarruf (YTD)", "value": "₺1.9M", "unit": "", "delta": 22, "deltaLabel": "+22%", "description": "Hedef fiyata göre", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Açık Satın Alma Siparişleri",
                "statusKey": "status",
                "columns": [
                    {"key": "po", "label": "Sipariş No"},
                    {"key": "supplier", "label": "Tedarikçi"},
                    {"key": "item", "label": "Kalem"},
                    {"key": "amount", "label": "Tutar", "align": "right"},
                    {"key": "due", "label": "Teslim"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"po": "PO-2026-01184", "supplier": "Ereğli Demir Çelik A.Ş.", "item": "Sac Rulo DC01 1.5 mm", "amount": "₺1,240,000", "due": "28 Eyl 2026", "status": "Onaylandı"},
                    {"po": "PO-2026-01191", "supplier": "Siemens Sanayi ve Tic. A.Ş.", "item": "S7-1500 PLC Seti", "amount": "₺386,500", "due": "02 Eki 2026", "status": "Yolda"},
                    {"po": "PO-2026-01197", "supplier": "Sensortek Ltd.", "item": "Endüktif Sensör M18", "amount": "₺42,300", "due": "24 Eyl 2026", "status": "Onay Bekliyor"},
                    {"po": "PO-2026-01203", "supplier": "Petrol Ofisi A.Ş.", "item": "Hidrolik Yağ 46 – 20 varil", "amount": "₺168,000", "due": "30 Eyl 2026", "status": "Onaylandı"},
                    {"po": "PO-2026-01208", "supplier": "MetalForm San. Tic.", "item": "Kasa Sacı Lazer Kesim", "amount": "₺512,750", "due": "07 Eki 2026", "status": "Teklif Aşaması"},
                ],
            },
            {
                "type": "chart",
                "title": "Kategori Bazlı Aylık Harcama (₺M)",
                "chartType": "bar",
                "unit": "₺M",
                "data": _SATINALMA_CHART,
                "xKey": "month",
                "yKeys": ["Hammadde", "Yardımcı Malzeme", "Hizmet"],
            },
            {
                "type": "progress",
                "title": "Onay Akışı Durumu (Bu Ay)",
                "items": [
                    {"label": "Onaylanan", "value": 74, "color": "success"},
                    {"label": "Onay Bekleyen", "value": 16, "color": "warning"},
                    {"label": "Revizyon İstenen", "value": 7, "color": "accent"},
                    {"label": "Reddedilen", "value": 3, "color": "danger"},
                ],
            },
        ],
        "toolsTitle": "Satın Alma Araçları",
        "tools": [
            {"title": "Satın Alma Talebi Oluştur", "description": "Departman talepleri ve bütçe kontrolü.", "icon": "file-plus"},
            {"title": "Teklif Karşılaştırma (RFQ)", "description": "Çoklu tedarikçi teklif analizi.", "icon": "scale"},
            {"title": "Sözleşme Takibi", "description": "Çerçeve anlaşmalar ve yenileme tarihleri.", "icon": "file-signature"},
            {"title": "Onay Akışı Yönetimi", "description": "Tutar bazlı onay matrisi ve delegasyon.", "icon": "git-merge"},
        ],
    },
    "tedarikciler": {
        "slug": "tedarikciler",
        "title": "Tedarikçi Yönetimi",
        "navTitle": "Tedarikçi Yönetimi",
        "icon": "handshake",
        "subtitle": "Tedarikçi performans skorları, denetimler ve risk profili",
        "kpis": [
            {"key": "active", "label": "Aktif Tedarikçi", "value": 128, "unit": "", "delta": 6, "deltaLabel": "+6", "description": "Onaylı tedarikçi listesi", "color": "primary"},
            {"key": "score", "label": "Ort. Performans Skoru", "value": 87.4, "unit": "/100", "delta": 1.9, "deltaLabel": "+1.9", "description": "Teslimat, kalite, fiyat", "color": "success"},
            {"key": "approved", "label": "Denetimi Güncel Tedarikçi", "value": 91, "unit": "%", "delta": 4, "deltaLabel": "+4%", "description": "Son 12 ayda denetlenen", "color": "accent"},
            {"key": "reject", "label": "Giriş Kalite Ret Oranı", "value": 0.9, "unit": "%", "delta": -0.3, "deltaLabel": "-0.3%", "description": "Parti bazlı", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Tedarikçi Performans Kartı",
                "statusKey": "grade",
                "columns": [
                    {"key": "supplier", "label": "Firma"},
                    {"key": "category", "label": "Kategori"},
                    {"key": "delivery", "label": "Teslimat", "align": "right"},
                    {"key": "quality", "label": "Kalite", "align": "right"},
                    {"key": "score", "label": "Skor", "align": "right"},
                    {"key": "grade", "label": "Sınıf"},
                ],
                "rows": [
                    {"supplier": "Ereğli Demir Çelik A.Ş.", "category": "Hammadde", "delivery": "98.2%", "quality": "99.6%", "score": 96, "grade": "A"},
                    {"supplier": "Siemens Sanayi ve Tic. A.Ş.", "category": "Otomasyon", "delivery": "96.5%", "quality": "99.9%", "score": 95, "grade": "A"},
                    {"supplier": "Sensortek Ltd.", "category": "Elektronik", "delivery": "91.0%", "quality": "98.1%", "score": 88, "grade": "B"},
                    {"supplier": "MetalForm San. Tic.", "category": "Talaşlı İmalat", "delivery": "88.4%", "quality": "97.2%", "score": 84, "grade": "B"},
                    {"supplier": "Anadolu Ambalaj Ltd.", "category": "Ambalaj", "delivery": "93.7%", "quality": "99.0%", "score": 90, "grade": "A"},
                    {"supplier": "Kartal Plastik San.", "category": "Enjeksiyon", "delivery": "79.5%", "quality": "94.8%", "score": 71, "grade": "C"},
                ],
            },
            {
                "type": "chart",
                "title": "Giriş Kalite Ret Oranı (PPM, 6 Ay)",
                "chartType": "line",
                "unit": "ppm",
                "data": _TEDARIKCI_CHART,
                "xKey": "month",
                "yKeys": ["Ret PPM"],
            },
            {
                "type": "progress",
                "title": "Tedarikçi Risk Dağılımı",
                "items": [
                    {"label": "Düşük Risk", "value": 62, "color": "success"},
                    {"label": "Orta Risk", "value": 27, "color": "warning"},
                    {"label": "Yüksek Risk", "value": 8, "color": "danger"},
                    {"label": "Değerlendirilmedi", "value": 3, "color": "muted"},
                ],
            },
        ],
        "toolsTitle": "Tedarikçi Araçları",
        "tools": [
            {"title": "Tedarikçi Denetim Planı", "description": "IATF 16949 uyumlu saha denetim takvimi.", "icon": "calendar-check"},
            {"title": "Skor Kartı Kuralları", "description": "Ağırlıklandırma ve eşik değer tanımları.", "icon": "sliders-horizontal"},
            {"title": "Risk Değerlendirme", "description": "Finansal, coğrafi ve tek kaynak riskleri.", "icon": "shield-alert"},
            {"title": "Yeni Tedarikçi Onayı", "description": "Ön değerlendirme anketi ve numune onayı (PPAP).", "icon": "user-check"},
        ],
    },
    "lojistik": {
        "slug": "lojistik",
        "title": "Lojistik & Sevkiyat",
        "navTitle": "Lojistik & Sevkiyat",
        "icon": "truck",
        "subtitle": "Sevkiyat planı, araç doluluk ve teslimat performansı",
        "kpis": [
            {"key": "today", "label": "Bugünkü Sevkiyat", "value": 42, "unit": "araç", "delta": 5, "deltaLabel": "+5", "description": "Planlanan 44", "color": "primary"},
            {"key": "otd", "label": "Zamanında Teslim", "value": 96.3, "unit": "%", "delta": 0.8, "deltaLabel": "+0.8%", "description": "Son 30 gün", "color": "success"},
            {"key": "fill", "label": "Ort. Araç Doluluk", "value": 84, "unit": "%", "delta": 3, "deltaLabel": "+3%", "description": "Hacim bazlı", "color": "accent"},
            {"key": "freight", "label": "Navlun Maliyeti / Ton", "value": "₺412", "unit": "", "delta": -4.2, "deltaLabel": "-4.2%", "description": "Aylık ortalama", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Günün Sevkiyatları",
                "statusKey": "status",
                "columns": [
                    {"key": "shipment", "label": "Sevkiyat No"},
                    {"key": "customer", "label": "Müşteri"},
                    {"key": "route", "label": "Rota"},
                    {"key": "vehicle", "label": "Araç"},
                    {"key": "departure", "label": "Çıkış"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"shipment": "SVK-2026-0912", "customer": "Tofaş Türk Otomobil Fab.", "route": "Gebze → Bursa", "vehicle": "34 KLM 418 (Tır)", "departure": "06:40", "status": "Teslim Edildi"},
                    {"shipment": "SVK-2026-0913", "customer": "Arçelik A.Ş. Çayırova", "route": "Gebze → Çayırova", "vehicle": "41 AR 2204 (Kamyon)", "departure": "08:15", "status": "Yolda"},
                    {"shipment": "SVK-2026-0914", "customer": "Vestel Elektronik", "route": "Gebze → Manisa", "vehicle": "35 VS 917 (Tır)", "departure": "09:30", "status": "Yolda"},
                    {"shipment": "SVK-2026-0915", "customer": "BSH Ev Aletleri", "route": "Gebze → Çerkezköy", "vehicle": "59 BH 331 (Kamyon)", "departure": "11:00", "status": "Yükleniyor"},
                    {"shipment": "SVK-2026-0916", "customer": "Ford Otosan Gölcük", "route": "Gebze → Gölcük", "vehicle": "41 FO 776 (Tır)", "departure": "13:30", "status": "Planlandı"},
                    {"shipment": "SVK-2026-0917", "customer": "Bosch Bursa", "route": "Gebze → Bursa", "vehicle": "16 BS 502 (Tır)", "departure": "15:00", "status": "Planlandı"},
                ],
            },
            {
                "type": "chart",
                "title": "Haftalık Sevkiyat Adedi (Son 8 Hafta)",
                "chartType": "bar",
                "unit": "sevkiyat",
                "data": _LOJISTIK_CHART,
                "xKey": "week",
                "yKeys": ["Planlanan", "Gerçekleşen"],
            },
            {
                "type": "cards",
                "title": "Taşıma Modu Dağılımı (Bu Ay)",
                "items": [
                    {"title": "Karayolu", "value": 612, "unit": "sevkiyat", "status": "Aktif"},
                    {"title": "Deniz Yolu", "value": 48, "unit": "konteyner", "status": "Aktif"},
                    {"title": "Demiryolu", "value": 22, "unit": "vagon", "status": "Aktif"},
                    {"title": "Hava Kargo", "value": 7, "unit": "gönderi", "status": "Acil"},
                ],
            },
        ],
        "toolsTitle": "Lojistik Araçları",
        "tools": [
            {"title": "Rota Optimizasyonu", "description": "Çok duraklı rota ve yakıt maliyeti hesaplama.", "icon": "route"},
            {"title": "Araç Takip (GPS)", "description": "Canlı konum, ETA ve sıcaklık izleme.", "icon": "map-pin"},
            {"title": "Yükleme Planı", "description": "Palet yerleşimi ve ağırlık dağılımı.", "icon": "package"},
            {"title": "Navlun Analizi", "description": "Taşıyıcı bazlı maliyet ve performans karşılaştırması.", "icon": "bar-chart-3"},
        ],
    },
    # ------------------------------------------------------------- Müşteri & İnsan
    "musteriler": {
        "slug": "musteriler",
        "title": "Müşteri Yönetimi (CRM)",
        "navTitle": "Müşteri Yönetimi",
        "icon": "users-round",
        "subtitle": "Müşteri portföyü, sipariş hacmi ve memnuniyet takibi",
        "kpis": [
            {"key": "active", "label": "Aktif Müşteri", "value": 312, "unit": "", "delta": 18, "deltaLabel": "+18", "description": "Son 12 ayda sipariş veren", "color": "primary"},
            {"key": "nps", "label": "NPS Skoru", "value": 62, "unit": "", "delta": 5, "deltaLabel": "+5", "description": "Q3 2026 anketi", "color": "success"},
            {"key": "acv", "label": "Yıllık Sözleşme Değeri", "value": "₺186M", "unit": "", "delta": 11.4, "deltaLabel": "+11.4%", "description": "Aktif çerçeve sözleşmeler", "color": "accent"},
            {"key": "resolution", "label": "Şikayet Çözüm Süresi", "value": 2.4, "unit": "gün", "delta": -0.7, "deltaLabel": "-0.7 gün", "description": "Ortalama kapanış", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "En Büyük 6 Müşteri",
                "statusKey": "segment",
                "columns": [
                    {"key": "customer", "label": "Müşteri"},
                    {"key": "sector", "label": "Sektör"},
                    {"key": "revenue", "label": "Yıllık Ciro", "align": "right"},
                    {"key": "openOrders", "label": "Açık Sipariş", "align": "right"},
                    {"key": "lastOrder", "label": "Son Sipariş"},
                    {"key": "segment", "label": "Segment"},
                ],
                "rows": [
                    {"customer": "Tofaş Türk Otomobil Fab.", "sector": "Otomotiv", "revenue": "₺42.8M", "openOrders": 14, "lastOrder": "19 Eyl 2026", "segment": "Stratejik"},
                    {"customer": "Arçelik A.Ş.", "sector": "Beyaz Eşya", "revenue": "₺31.2M", "openOrders": 9, "lastOrder": "18 Eyl 2026", "segment": "Stratejik"},
                    {"customer": "Ford Otosan", "sector": "Otomotiv", "revenue": "₺27.6M", "openOrders": 11, "lastOrder": "20 Eyl 2026", "segment": "Stratejik"},
                    {"customer": "Vestel Elektronik", "sector": "Elektronik", "revenue": "₺18.9M", "openOrders": 6, "lastOrder": "15 Eyl 2026", "segment": "Anahtar"},
                    {"customer": "Aselsan A.Ş.", "sector": "Savunma", "revenue": "₺12.4M", "openOrders": 3, "lastOrder": "11 Eyl 2026", "segment": "Anahtar"},
                    {"customer": "Enerjisa Üretim", "sector": "Enerji", "revenue": "₺8.7M", "openOrders": 2, "lastOrder": "02 Eyl 2026", "segment": "Büyüyen"},
                ],
            },
            {
                "type": "chart",
                "title": "Yeni ve Kaybedilen Müşteri (6 Ay)",
                "chartType": "bar",
                "unit": "müşteri",
                "data": _MUSTERI_CHART,
                "xKey": "month",
                "yKeys": ["Yeni Müşteri", "Kaybedilen"],
            },
            {
                "type": "progress",
                "title": "Sektör Bazlı Ciro Dağılımı",
                "items": [
                    {"label": "Otomotiv", "value": 46, "color": "primary"},
                    {"label": "Beyaz Eşya", "value": 24, "color": "secondary"},
                    {"label": "Elektronik", "value": 13, "color": "accent"},
                    {"label": "Savunma & Havacılık", "value": 9, "color": "sage"},
                    {"label": "Enerji ve Diğer", "value": 8, "color": "muted"},
                ],
            },
        ],
        "toolsTitle": "CRM Araçları",
        "tools": [
            {"title": "Fırsat Boru Hattı", "description": "Teklif aşamasındaki fırsatlar ve kazanma oranı.", "icon": "kanban"},
            {"title": "Şikayet Yönetimi", "description": "8D raporları ve kök neden takibi.", "icon": "message-square-warning"},
            {"title": "Sözleşme Yenilemeleri", "description": "Süresi yaklaşan çerçeve anlaşmalar.", "icon": "file-clock"},
            {"title": "Müşteri Ziyaret Planı", "description": "Saha ziyaretleri ve toplantı notları.", "icon": "calendar-days"},
        ],
    },
    "vardiya": {
        "slug": "vardiya",
        "title": "Vardiya Planlama",
        "navTitle": "Vardiya Planlama",
        "icon": "calendar-clock",
        "subtitle": "Vardiya planı, personel dağılımı ve fazla mesai takibi",
        "kpis": [
            {"key": "planned", "label": "Planlanan Personel (Bugün)", "value": 486, "unit": "", "delta": 4, "deltaLabel": "+4", "description": "3 vardiya toplamı", "color": "primary"},
            {"key": "absence", "label": "Devamsızlık Oranı", "value": 3.1, "unit": "%", "delta": -0.5, "deltaLabel": "-0.5%", "description": "Son 30 gün", "color": "success"},
            {"key": "overtime", "label": "Fazla Mesai (Bu Ay)", "value": "1,240", "unit": "saat", "delta": 6.2, "deltaLabel": "+6.2%", "description": "Hedef 1,100 saat", "color": "warning"},
            {"key": "fill", "label": "Vardiya Doluluk", "value": 97.5, "unit": "%", "delta": 0.9, "deltaLabel": "+0.9%", "description": "Plan / fiili", "color": "accent"},
        ],
        "sections": [
            {
                "type": "cards",
                "title": "Bugünün Vardiyaları",
                "items": [
                    {"title": "Sabah Vardiyası · 06:00–14:00", "value": 182, "unit": "personel", "status": "Tamamlandı", "progress": 100, "meta": "Amir: Hakan Öztürk · Devamsız 4"},
                    {"title": "Öğle Vardiyası · 14:00–22:00", "value": 176, "unit": "personel", "status": "Aktif", "progress": 62, "meta": "Amir: Selin Aydın · Devamsız 6"},
                    {"title": "Gece Vardiyası · 22:00–06:00", "value": 128, "unit": "personel", "status": "Planlandı", "progress": 0, "meta": "Amir: Murat Koç · Onay bekleyen 3"},
                ],
            },
            {
                "type": "table",
                "title": "Hat Bazlı Vardiya Atamaları",
                "statusKey": "status",
                "columns": [
                    {"key": "line", "label": "Hat / Alan"},
                    {"key": "shift", "label": "Vardiya"},
                    {"key": "supervisor", "label": "Amir"},
                    {"key": "staff", "label": "Personel", "align": "right"},
                    {"key": "required", "label": "Gerekli", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"line": "Montaj Hattı 1", "shift": "Sabah", "supervisor": "Hakan Öztürk", "staff": 42, "required": 42, "status": "Tam"},
                    {"line": "Montaj Hattı 2", "shift": "Sabah", "supervisor": "Emre Kılıç", "staff": 38, "required": 40, "status": "Eksik"},
                    {"line": "CNC İşleme Merkezi", "shift": "Öğle", "supervisor": "Selin Aydın", "staff": 24, "required": 24, "status": "Tam"},
                    {"line": "Paketleme Hattı A", "shift": "Öğle", "supervisor": "Burak Şen", "staff": 30, "required": 32, "status": "Eksik"},
                    {"line": "Pres Hattı", "shift": "Gece", "supervisor": "Murat Koç", "staff": 26, "required": 26, "status": "Tam"},
                    {"line": "Kalite Kontrol", "shift": "Gece", "supervisor": "Deniz Arslan", "staff": 8, "required": 8, "status": "Tam"},
                ],
            },
            {
                "type": "chart",
                "title": "Vardiya Bazlı Fazla Mesai (Saat, Bu Hafta)",
                "chartType": "bar",
                "unit": "saat",
                "data": _VARDIYA_CHART,
                "xKey": "day",
                "yKeys": ["Sabah", "Öğle", "Gece"],
            },
        ],
        "toolsTitle": "Vardiya Araçları",
        "tools": [
            {"title": "Vardiya Planlayıcı", "description": "Sürükle-bırak haftalık plan ve rotasyon kuralları.", "icon": "calendar-range"},
            {"title": "İzin Talepleri", "description": "Yıllık izin, rapor ve mazeret onayları.", "icon": "plane"},
            {"title": "Fazla Mesai Onayı", "description": "Amir onaylı mesai kayıtları ve bordro aktarımı.", "icon": "clock"},
            {"title": "Yetkinlik Matrisi", "description": "Hat bazlı sertifikalı operatör eşleşmesi.", "icon": "grid-3x3"},
        ],
    },
    "isg": {
        "slug": "isg",
        "title": "İş Sağlığı & Güvenliği",
        "navTitle": "İş Sağlığı & Güvenliği",
        "icon": "hard-hat",
        "subtitle": "Kaza istatistikleri, risk değerlendirmeleri ve ISO 45001 uyumu",
        "kpis": [
            {"key": "safeDays", "label": "Kazasız Gün", "value": 214, "unit": "gün", "delta": 30, "deltaLabel": "+30", "description": "Son kayıp günlü kazadan bu yana", "color": "success"},
            {"key": "ltifr", "label": "LTIFR", "value": 0.82, "unit": "", "delta": -0.21, "deltaLabel": "-0.21", "description": "Milyon saatte kayıp günlü kaza", "color": "primary"},
            {"key": "nearMiss", "label": "Ramak Kala Bildirimi", "value": 37, "unit": "", "delta": 9, "deltaLabel": "+9", "description": "Bu ay (artış olumlu)", "color": "accent"},
            {"key": "training", "label": "İSG Eğitim Tamamlama", "value": 96, "unit": "%", "delta": 2, "deltaLabel": "+2%", "description": "Zorunlu eğitimler", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Son Olay Kayıtları",
                "statusKey": "severity",
                "columns": [
                    {"key": "date", "label": "Tarih"},
                    {"key": "event", "label": "Olay"},
                    {"key": "area", "label": "Alan"},
                    {"key": "type", "label": "Tür"},
                    {"key": "severity", "label": "Şiddet"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"date": "19 Eyl 2026", "event": "Forklift geri manevrada yaya yakınlaşması", "area": "Ana Depo A", "type": "Ramak Kala", "severity": "Orta", "status": "Kök Neden Analizi"},
                    {"date": "16 Eyl 2026", "event": "Pres kalıp değişiminde el sıkışması", "area": "Pres Hattı", "type": "İlk Yardım", "severity": "Düşük", "status": "Kapatıldı"},
                    {"date": "12 Eyl 2026", "event": "Hidrolik hortum patlaması, yağ sızıntısı", "area": "CNC-3", "type": "Maddi Hasar", "severity": "Orta", "status": "DÖF Açık"},
                    {"date": "08 Eyl 2026", "event": "Yüksekte çalışmada emniyet kemeri eksikliği", "area": "Çatı Bakım", "type": "Güvensiz Davranış", "severity": "Yüksek", "status": "Eğitim Verildi"},
                    {"date": "03 Eyl 2026", "event": "Kimyasal etiketleme uygunsuzluğu", "area": "Kimyasal Deposu", "type": "Uygunsuzluk", "severity": "Düşük", "status": "Kapatıldı"},
                ],
            },
            {
                "type": "chart",
                "title": "Kaza ve Ramak Kala Trendi (6 Ay)",
                "chartType": "bar",
                "unit": "olay",
                "data": _ISG_CHART,
                "xKey": "month",
                "yKeys": ["Kaza", "Ramak Kala"],
            },
            {
                "type": "progress",
                "title": "ISO 45001:2018 Madde Uyumu",
                "items": [
                    {"label": "Md. 6 – Planlama ve Risk Değerlendirme", "value": 94, "color": "success"},
                    {"label": "Md. 7 – Yetkinlik ve Farkındalık", "value": 96, "color": "success"},
                    {"label": "Md. 8 – Operasyonel Kontrol", "value": 88, "color": "primary"},
                    {"label": "Md. 9 – Performans Değerlendirme", "value": 82, "color": "warning"},
                    {"label": "Md. 10 – İyileştirme (DÖF)", "value": 76, "color": "accent"},
                ],
            },
        ],
        "toolsTitle": "İSG Araçları",
        "tools": [
            {"title": "Risk Değerlendirme (Fine-Kinney)", "description": "Alan bazlı tehlike ve risk puanlama.", "icon": "shield-check"},
            {"title": "Ramak Kala Bildir", "description": "Mobil uyumlu hızlı bildirim formu.", "icon": "siren"},
            {"title": "KKD Takibi", "description": "Kişisel koruyucu donanım zimmet ve yenileme.", "icon": "hard-hat"},
            {"title": "İSG Kurulu Toplantıları", "description": "Aylık kurul kararları ve aksiyon takibi.", "icon": "users"},
        ],
    },
    # ------------------------------------------------------------- Varlık & Zekâ
    "varliklar": {
        "slug": "varliklar",
        "title": "Varlık & Makine Yönetimi",
        "navTitle": "Varlık & Makine",
        "icon": "cpu",
        "subtitle": "Makine envanteri, sağlık skorları ve sensör tabanlı durum izleme",
        "kpis": [
            {"key": "assets", "label": "Kayıtlı Varlık", "value": 312, "unit": "", "delta": 8, "deltaLabel": "+8", "description": "Makine, ekipman, araç", "color": "primary"},
            {"key": "health", "label": "Ort. Sağlık Skoru", "value": 86, "unit": "/100", "delta": -1, "deltaLabel": "-1", "description": "Titreşim, sıcaklık, akım", "color": "success"},
            {"key": "critical", "label": "Kritik Durumda", "value": 5, "unit": "varlık", "delta": 2, "deltaLabel": "+2", "description": "Bakım önerisi açık", "color": "warning"},
            {"key": "utilization", "label": "Varlık Kullanım Oranı", "value": 78.4, "unit": "%", "delta": 2.3, "deltaLabel": "+2.3%", "description": "Çalışma / takvim saati", "color": "accent"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Kritik Varlıklar ve Sensör Durumu",
                "statusKey": "status",
                "columns": [
                    {"key": "asset", "label": "Varlık"},
                    {"key": "code", "label": "Kod"},
                    {"key": "location", "label": "Lokasyon"},
                    {"key": "health", "label": "Sağlık", "align": "right"},
                    {"key": "sensor", "label": "Sensör"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"asset": "CNC Dik İşleme Merkezi 3", "code": "MC-CNC-03", "location": "Talaşlı İmalat", "health": 62, "sensor": "VIB-CNC3-01", "status": "Kritik"},
                    {"asset": "Hidrolik Pres 400 t", "code": "MC-PRS-02", "location": "Pres Hattı", "health": 71, "sensor": "TMP-PRS2-04", "status": "İzleniyor"},
                    {"asset": "Kaynak Robotu KUKA KR-16", "code": "RB-WLD-05", "location": "Kaynak Hücresi", "health": 89, "sensor": "CUR-WLD5-02", "status": "Sağlıklı"},
                    {"asset": "Vidalı Kompresör 75 kW", "code": "UT-CMP-01", "location": "Kompresör Odası", "health": 58, "sensor": "VIB-CMP1-01", "status": "Kritik"},
                    {"asset": "Konveyör Hattı A", "code": "CV-PCK-A", "location": "Paketleme", "health": 92, "sensor": "SPD-CVA-03", "status": "Sağlıklı"},
                    {"asset": "Enjeksiyon Makinesi 250 t", "code": "MC-INJ-04", "location": "Plastik Enjeksiyon", "health": 77, "sensor": "TMP-INJ4-02", "status": "İzleniyor"},
                ],
            },
            {
                "type": "cards",
                "title": "Varlık Sınıfları",
                "items": [
                    {"title": "Üretim Makineleri", "value": 148, "unit": "varlık", "status": "Sağlık 84"},
                    {"title": "Robot & Otomasyon", "value": 36, "unit": "varlık", "status": "Sağlık 91"},
                    {"title": "Yardımcı Tesisler", "value": 52, "unit": "varlık", "status": "Sağlık 79"},
                    {"title": "İç Lojistik Araçları", "value": 76, "unit": "varlık", "status": "Sağlık 88"},
                ],
            },
            {
                "type": "chart",
                "title": "Hat Bazlı Sağlık Skoru Trendi (6 Ay)",
                "chartType": "line",
                "unit": "puan",
                "data": _VARLIK_CHART,
                "xKey": "month",
                "yKeys": ["CNC Hattı", "Pres Hattı", "Montaj"],
            },
        ],
        "toolsTitle": "Varlık Araçları",
        "tools": [
            {"title": "Varlık Kartı", "description": "Teknik özellikler, garanti ve bakım geçmişi.", "icon": "id-card"},
            {"title": "Sensör Yapılandırma", "description": "Eşik değerler, örnekleme sıklığı ve kalibrasyon.", "icon": "radio"},
            {"title": "Amortisman Takibi", "description": "Defter değeri ve yenileme planı.", "icon": "trending-down"},
            {"title": "Yedek Parça Bağlantısı", "description": "Varlık bazlı kritik yedek parça listesi.", "icon": "wrench"},
        ],
    },
    "tahmin": {
        "slug": "tahmin",
        "title": "AI Öngörü & Anomali",
        "navTitle": "AI Öngörü & Anomali",
        "icon": "brain-circuit",
        "subtitle": "Talep tahmini, anomali tespiti ve model performansı",
        "kpis": [
            {"key": "mape", "label": "Tahmin Hatası (MAPE)", "value": 6.8, "unit": "%", "delta": -1.1, "deltaLabel": "-1.1%", "description": "Son 3 ay geriye dönük", "color": "success"},
            {"key": "anomalies", "label": "Tespit Edilen Anomali", "value": 12, "unit": "", "delta": 4, "deltaLabel": "+4", "description": "Son 7 gün", "color": "warning"},
            {"key": "confidence", "label": "Model Güven Skoru", "value": 91, "unit": "%", "delta": 2, "deltaLabel": "+2%", "description": "Ensemble ortalaması", "color": "primary"},
            {"key": "avoided", "label": "Önlenen Duruş Maliyeti", "value": "₺640K", "unit": "", "delta": 18, "deltaLabel": "+18%", "description": "Erken uyarı sayesinde (YTD)", "color": "accent"},
        ],
        "sections": [
            {
                "type": "chart",
                "title": "12 Aylık Talep Tahmini (Bin Adet)",
                "chartType": "line",
                "unit": "bin adet",
                "data": _TAHMIN_CHART,
                "xKey": "month",
                "yKeys": ["Gerçek", "Tahmin", "Alt Bant", "Üst Bant"],
            },
            {
                "type": "table",
                "title": "Son Anomaliler",
                "statusKey": "severity",
                "columns": [
                    {"key": "sensor", "label": "Sensör"},
                    {"key": "time", "label": "Zaman"},
                    {"key": "value", "label": "Değer", "align": "right"},
                    {"key": "zscore", "label": "Z-Skoru", "align": "right"},
                    {"key": "severity", "label": "Şiddet"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"sensor": "VIB-CNC3-01", "time": "21 Eyl 2026 08:42", "value": "7.8 mm/s", "zscore": 4.6, "severity": "Kritik", "status": "İş Emri Açıldı"},
                    {"sensor": "TMP-PRS2-04", "time": "21 Eyl 2026 03:15", "value": "84 °C", "zscore": 3.2, "severity": "Yüksek", "status": "İnceleniyor"},
                    {"sensor": "CUR-WLD5-02", "time": "20 Eyl 2026 17:08", "value": "212 A", "zscore": 2.7, "severity": "Orta", "status": "İzleniyor"},
                    {"sensor": "PWR-MAIN-01", "time": "20 Eyl 2026 11:30", "value": "1,420 kW", "zscore": 2.4, "severity": "Orta", "status": "Açıklandı"},
                    {"sensor": "VIB-CMP1-01", "time": "19 Eyl 2026 22:51", "value": "6.1 mm/s", "zscore": 3.9, "severity": "Yüksek", "status": "İş Emri Açıldı"},
                    {"sensor": "FLW-HYD-02", "time": "19 Eyl 2026 06:04", "value": "38 L/dk", "zscore": 2.1, "severity": "Düşük", "status": "Kapatıldı"},
                ],
            },
            {
                "type": "cards",
                "title": "Aktif Modeller",
                "items": [
                    {"title": "Talep Tahmini · LSTM", "value": "93.2%", "unit": "doğruluk", "status": "Üretimde", "progress": 93, "meta": "Son eğitim: 14 Eyl 2026"},
                    {"title": "Arıza Öngörüsü · XGBoost", "value": "89.7%", "unit": "doğruluk", "status": "Üretimde", "progress": 90, "meta": "Son eğitim: 07 Eyl 2026"},
                    {"title": "Enerji Anomali · Isolation Forest", "value": "91.5%", "unit": "doğruluk", "status": "Üretimde", "progress": 92, "meta": "Son eğitim: 18 Eyl 2026"},
                    {"title": "Kalite Sapma · CNN", "value": "87.1%", "unit": "doğruluk", "status": "Pilot", "progress": 87, "meta": "Son eğitim: 20 Eyl 2026"},
                ],
            },
        ],
        "toolsTitle": "Öngörü Araçları",
        "tools": [
            {"title": "Model Yeniden Eğitimi", "description": "Yeni veriyle eğitim ve A/B karşılaştırma.", "icon": "refresh-cw"},
            {"title": "Anomali Kuralları", "description": "Z-skoru eşikleri ve bildirim kanalları.", "icon": "sliders-horizontal"},
            {"title": "Tahmin Senaryoları", "description": "Talep şoku ve sezonsallık senaryoları.", "icon": "git-branch"},
            {"title": "Veri Kalitesi Raporu", "description": "Eksik veri, kayma ve sensör sağlığı.", "icon": "database-zap"},
        ],
    },
    "hedefler": {
        "slug": "hedefler",
        "title": "Hedef & KPI Takibi",
        "navTitle": "Hedef & KPI (OKR)",
        "icon": "target",
        "subtitle": "OKR hedefleri, KPI gerçekleşmeleri ve departman ilerlemesi",
        "kpis": [
            {"key": "objectives", "label": "Aktif Hedef", "value": 24, "unit": "", "delta": 3, "deltaLabel": "+3", "description": "Q3 2026 dönemi", "color": "primary"},
            {"key": "onTrack", "label": "Yolunda Olan", "value": 17, "unit": "hedef", "delta": 2, "deltaLabel": "+2", "description": "%70 ve üzeri ilerleme", "color": "success"},
            {"key": "atRisk", "label": "Risk Altında", "value": 5, "unit": "hedef", "delta": -1, "deltaLabel": "-1", "description": "Plan gerisinde", "color": "warning"},
            {"key": "progress", "label": "Ort. İlerleme", "value": 68, "unit": "%", "delta": 9, "deltaLabel": "+9%", "description": "Çeyrek başından bu yana", "color": "accent"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Q3 2026 OKR Listesi",
                "statusKey": "status",
                "progressKey": "progress",
                "columns": [
                    {"key": "objective", "label": "Hedef"},
                    {"key": "owner", "label": "Sahip"},
                    {"key": "department", "label": "Departman"},
                    {"key": "keyResult", "label": "Anahtar Sonuç"},
                    {"key": "progress", "label": "İlerleme %", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"objective": "OEE'yi %85'e çıkar", "owner": "Hakan Öztürk", "department": "Üretim", "keyResult": "Planlanmamış duruş < 15 saat/ay", "progress": 82, "status": "Yolunda"},
                    {"objective": "Dış hata oranını 100 PPM altına indir", "owner": "Deniz Arslan", "department": "Kalite", "keyResult": "PPM 150 → 100", "progress": 64, "status": "Yolunda"},
                    {"objective": "Stok devir hızını 8'e yükselt", "owner": "Ayşe Demir", "department": "Tedarik Zinciri", "keyResult": "Ölü stok < %2", "progress": 45, "status": "Risk Altında"},
                    {"objective": "Enerji tüketimini %10 azalt", "owner": "Mehmet Kaya", "department": "Enerji", "keyResult": "kWh/birim 2.4 → 2.16", "progress": 71, "status": "Yolunda"},
                    {"objective": "İşe alım süresini 21 güne düşür", "owner": "Zeynep Şahin", "department": "İK", "keyResult": "Ort. 28 → 21 gün", "progress": 38, "status": "Risk Altında"},
                    {"objective": "Kazasız gün sayısını 365'e taşı", "owner": "Burak Şen", "department": "İSG", "keyResult": "LTIFR < 0.5", "progress": 59, "status": "Yolunda"},
                ],
            },
            {
                "type": "progress",
                "title": "Departman Bazlı Hedef İlerlemesi",
                "items": [
                    {"label": "Üretim", "value": 82, "color": "success"},
                    {"label": "Kalite", "value": 64, "color": "primary"},
                    {"label": "Enerji", "value": 71, "color": "primary"},
                    {"label": "Tedarik Zinciri", "value": 45, "color": "warning"},
                    {"label": "İnsan Kaynakları", "value": 38, "color": "danger"},
                    {"label": "İSG", "value": 59, "color": "accent"},
                ],
            },
        ],
        "toolsTitle": "Hedef Araçları",
        "tools": [
            {"title": "Yeni Hedef Tanımla", "description": "Hedef, anahtar sonuç ve sahip ataması.", "icon": "plus-circle"},
            {"title": "Check-in Takvimi", "description": "Haftalık ilerleme güncellemeleri.", "icon": "calendar-check"},
            {"title": "Hedef Ağacı", "description": "Şirket → departman → ekip hiyerarşisi.", "icon": "network"},
            {"title": "Çeyrek Değerlendirmesi", "description": "Dönem kapanış puanlaması ve dersler.", "icon": "award"},
        ],
    },
    # ------------------------------------------------------------- Yönetişim
    "uyarilar": {
        "slug": "uyarilar",
        "title": "Uyarı Merkezi",
        "navTitle": "Uyarı Merkezi",
        "icon": "bell-ring",
        "subtitle": "Açık uyarılar, seviye dağılımı ve müdahale süreleri",
        "kpis": [
            {"key": "open", "label": "Açık Uyarı", "value": 23, "unit": "", "delta": -6, "deltaLabel": "-6", "description": "Şu an aktif", "color": "primary"},
            {"key": "critical", "label": "Kritik Seviye", "value": 3, "unit": "", "delta": 1, "deltaLabel": "+1", "description": "Anında müdahale gerekli", "color": "danger"},
            {"key": "mttr", "label": "Ort. Müdahale Süresi", "value": 14, "unit": "dk", "delta": -3, "deltaLabel": "-3 dk", "description": "Bildirim → onay", "color": "success"},
            {"key": "resolved", "label": "Bu Hafta Çözülen", "value": 87, "unit": "", "delta": 12, "deltaLabel": "+12", "description": "Kapatılan uyarı", "color": "accent"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Aktif Uyarılar",
                "statusKey": "level",
                "columns": [
                    {"key": "id", "label": "ID"},
                    {"key": "time", "label": "Zaman"},
                    {"key": "source", "label": "Kaynak"},
                    {"key": "message", "label": "Mesaj"},
                    {"key": "level", "label": "Seviye"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"id": "ALR-7731", "time": "21 Eyl 2026 09:12", "source": "VIB-CNC3-01", "message": "Titreşim eşiği aşıldı (7.8 mm/s)", "level": "Kritik", "status": "Atandı"},
                    {"id": "ALR-7730", "time": "21 Eyl 2026 08:55", "source": "Stok · MX-4471", "message": "Servo sürücü stoğu min. seviyenin altında", "level": "Uyarı", "status": "Açık"},
                    {"id": "ALR-7728", "time": "21 Eyl 2026 07:40", "source": "Enerji · PWR-MAIN-01", "message": "Talep sınırı %92'ye ulaştı", "level": "Uyarı", "status": "Onaylandı"},
                    {"id": "ALR-7725", "time": "21 Eyl 2026 06:10", "source": "Kalite · Hat A", "message": "Ara kontrol uygunluğu %97'nin altına düştü", "level": "Uyarı", "status": "Açık"},
                    {"id": "ALR-7722", "time": "20 Eyl 2026 23:48", "source": "Entegrasyon · Logo Tiger", "message": "Fatura senkronu 2 kez başarısız", "level": "Kritik", "status": "Atandı"},
                    {"id": "ALR-7719", "time": "20 Eyl 2026 21:30", "source": "Vardiya · Gece", "message": "Montaj Hattı 2 personel eksik (38/40)", "level": "Bilgi", "status": "Açık"},
                ],
            },
            {
                "type": "progress",
                "title": "Seviye Dağılımı (Açık Uyarılar)",
                "items": [
                    {"label": "Kritik", "value": 13, "color": "danger"},
                    {"label": "Uyarı", "value": 52, "color": "warning"},
                    {"label": "Bilgi", "value": 35, "color": "info"},
                ],
            },
            {
                "type": "chart",
                "title": "Günlük Uyarı Adedi (Son 7 Gün)",
                "chartType": "bar",
                "unit": "uyarı",
                "data": _UYARI_CHART,
                "xKey": "day",
                "yKeys": ["Kritik", "Uyarı", "Bilgi"],
            },
        ],
        "toolsTitle": "Uyarı Araçları",
        "tools": [
            {"title": "Uyarı Kuralları", "description": "Eşik, koşul ve sıklık tanımları.", "icon": "sliders-horizontal"},
            {"title": "Eskalasyon Zinciri", "description": "Yanıt gelmezse üst kademe bildirimi.", "icon": "arrow-up-right"},
            {"title": "Sessize Alma Pencereleri", "description": "Planlı bakımda bildirimleri askıya al.", "icon": "bell-off"},
            {"title": "Bildirim Kanalları", "description": "E-posta, SMS, Teams ve mobil push.", "icon": "send"},
        ],
    },
    "denetim": {
        "slug": "denetim",
        "title": "Denetim Günlüğü",
        "navTitle": "Denetim Günlüğü",
        "icon": "scroll-text",
        "subtitle": "Kullanıcı işlemleri, sistem olayları ve uyum izleri",
        "kpis": [
            {"key": "events", "label": "Bugünkü Olay", "value": "1,842", "unit": "", "delta": 4.5, "deltaLabel": "+4.5%", "description": "Tüm kaynaklar", "color": "primary"},
            {"key": "failedLogin", "label": "Başarısız Giriş", "value": 7, "unit": "", "delta": -3, "deltaLabel": "-3", "description": "Son 24 saat", "color": "warning"},
            {"key": "permChange", "label": "Yetki Değişikliği", "value": 3, "unit": "", "delta": 1, "deltaLabel": "+1", "description": "Bu hafta", "color": "accent"},
            {"key": "retention", "label": "Saklama Süresi", "value": 365, "unit": "gün", "delta": 0, "deltaLabel": "", "description": "KVKK / ISO 27001 politikası", "color": "success"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Son Denetim Kayıtları",
                "statusKey": "result",
                "columns": [
                    {"key": "time", "label": "Zaman"},
                    {"key": "user", "label": "Kullanıcı"},
                    {"key": "action", "label": "İşlem"},
                    {"key": "target", "label": "Hedef"},
                    {"key": "ip", "label": "IP"},
                    {"key": "result", "label": "Sonuç"},
                ],
                "rows": [
                    {"time": "21 Eyl 2026 09:14", "user": "ahmet@ornek.com", "action": "Rol güncellendi", "target": "Kullanıcı: mehmet@ornek.com → Yönetici", "ip": "10.20.4.18", "result": "Başarılı"},
                    {"time": "21 Eyl 2026 08:47", "user": "ayse@ornek.com", "action": "Rapor dışa aktarıldı", "target": "Aylık Finans Raporu (PDF)", "ip": "10.20.4.31", "result": "Başarılı"},
                    {"time": "21 Eyl 2026 08:02", "user": "bilinmiyor", "action": "Giriş denemesi", "target": "zeynep@ornek.com", "ip": "185.94.12.77", "result": "Başarısız"},
                    {"time": "21 Eyl 2026 07:38", "user": "sistem", "action": "Senkron tamamlandı", "target": "SAP S/4HANA · MM modülü", "ip": "10.20.1.5", "result": "Başarılı"},
                    {"time": "20 Eyl 2026 23:51", "user": "mehmet@ornek.com", "action": "Veri kaynağı silindi", "target": "Ürün Kataloğu (CSV)", "ip": "10.20.4.44", "result": "Başarılı"},
                    {"time": "20 Eyl 2026 18:20", "user": "ali@ornek.com", "action": "Tema değiştirildi", "target": "Vurgu rengi", "ip": "10.20.4.52", "result": "Başarılı"},
                ],
            },
            {
                "type": "chart",
                "title": "Saatlik Olay Yoğunluğu (Bugün)",
                "chartType": "area",
                "unit": "olay",
                "data": _DENETIM_CHART,
                "xKey": "hour",
                "yKeys": ["Olay"],
            },
            {
                "type": "cards",
                "title": "Olay Kategorileri (Son 24 Saat)",
                "items": [
                    {"title": "Kimlik ve Erişim", "value": 412, "unit": "olay"},
                    {"title": "Veri Değişikliği", "value": 638, "unit": "olay"},
                    {"title": "Rapor ve Dışa Aktarım", "value": 187, "unit": "olay"},
                    {"title": "Sistem ve Entegrasyon", "value": 605, "unit": "olay"},
                ],
            },
        ],
        "toolsTitle": "Denetim Araçları",
        "tools": [
            {"title": "Günlüğü Dışa Aktar", "description": "CSV / JSON, tarih aralığı ve filtre ile.", "icon": "download"},
            {"title": "KVKK Uyum Raporu", "description": "Kişisel veri erişim izleri ve talepler.", "icon": "file-lock"},
            {"title": "Şüpheli Etkinlik", "description": "Anormal saat ve konumdan erişim tespiti.", "icon": "eye"},
            {"title": "Saklama Politikası", "description": "Arşivleme ve silme kuralları.", "icon": "archive"},
        ],
    },
    "belgeler": {
        "slug": "belgeler",
        "title": "Belge Yönetimi",
        "navTitle": "Belge Yönetimi",
        "icon": "folder-open",
        "subtitle": "Prosedürler, talimatlar ve sertifikaların sürüm kontrollü yönetimi",
        "kpis": [
            {"key": "documents", "label": "Toplam Belge", "value": "2,418", "unit": "", "delta": 36, "deltaLabel": "+36", "description": "Aktif sürümler", "color": "primary"},
            {"key": "pendingApproval", "label": "Onay Bekleyen", "value": 16, "unit": "", "delta": -4, "deltaLabel": "-4", "description": "Revizyon onay kuyruğu", "color": "warning"},
            {"key": "expiring", "label": "Süresi Yaklaşan", "value": 9, "unit": "", "delta": 2, "deltaLabel": "+2", "description": "90 gün içinde", "color": "accent"},
            {"key": "compliance", "label": "Revizyon Uyumu", "value": 98.1, "unit": "%", "delta": 0.6, "deltaLabel": "+0.6%", "description": "Güncel sürüm kullanımı", "color": "success"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Son Güncellenen Belgeler",
                "statusKey": "status",
                "columns": [
                    {"key": "docNo", "label": "Belge No"},
                    {"key": "title", "label": "Başlık"},
                    {"key": "type", "label": "Tür"},
                    {"key": "rev", "label": "Rev.", "align": "right"},
                    {"key": "validUntil", "label": "Geçerlilik"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"docNo": "PR-KY-012", "title": "Uygunsuzluk ve Düzeltici Faaliyet Prosedürü", "type": "Prosedür", "rev": "R7", "validUntil": "31 Ara 2027", "status": "Yayında"},
                    {"docNo": "TL-UR-118", "title": "CNC-3 Kalıp Değişim Talimatı", "type": "Talimat", "rev": "R3", "validUntil": "30 Haz 2027", "status": "Onay Bekliyor"},
                    {"docNo": "FR-ISG-044", "title": "Ramak Kala Bildirim Formu", "type": "Form", "rev": "R2", "validUntil": "31 Ara 2026", "status": "Yayında"},
                    {"docNo": "SRT-IATF-001", "title": "IATF 16949:2016 Sertifikası", "type": "Sertifika", "rev": "—", "validUntil": "14 Kas 2026", "status": "Süresi Yaklaşıyor"},
                    {"docNo": "SRT-ISO-45001", "title": "ISO 45001:2018 Sertifikası", "type": "Sertifika", "rev": "—", "validUntil": "22 Mar 2028", "status": "Yayında"},
                    {"docNo": "PL-KY-003", "title": "Kalite El Kitabı", "type": "El Kitabı", "rev": "R12", "validUntil": "31 Ara 2027", "status": "Revizyonda"},
                ],
            },
            {
                "type": "progress",
                "title": "Belge Türü Dağılımı",
                "items": [
                    {"label": "Talimatlar", "value": 41, "color": "primary"},
                    {"label": "Formlar", "value": 28, "color": "secondary"},
                    {"label": "Prosedürler", "value": 17, "color": "accent"},
                    {"label": "Teknik Çizimler", "value": 11, "color": "sage"},
                    {"label": "Sertifikalar ve Diğer", "value": 3, "color": "muted"},
                ],
            },
            {
                "type": "cards",
                "title": "Sertifika Durumu",
                "items": [
                    {"title": "ISO 9001:2015", "value": "Geçerli", "unit": "Son geçerlilik: 05 Şub 2028", "status": "Aktif"},
                    {"title": "IATF 16949:2016", "value": "56 gün", "unit": "Yenileme denetimi: 14 Kas 2026", "status": "Yaklaşıyor"},
                    {"title": "ISO 45001:2018", "value": "Geçerli", "unit": "Son geçerlilik: 22 Mar 2028", "status": "Aktif"},
                    {"title": "ISO 14001:2015", "value": "Geçerli", "unit": "Son geçerlilik: 09 Eyl 2027", "status": "Aktif"},
                    {"title": "ISO 50001:2018", "value": "Geçerli", "unit": "Son geçerlilik: 18 Oca 2028", "status": "Aktif"},
                ],
            },
        ],
        "toolsTitle": "Belge Araçları",
        "tools": [
            {"title": "Yeni Belge Oluştur", "description": "Şablondan belge ve numara ataması.", "icon": "file-plus"},
            {"title": "Onay Akışı", "description": "Hazırlayan → kontrol → onay zinciri.", "icon": "git-merge"},
            {"title": "Sertifika Takvimi", "description": "Denetim ve yenileme tarihleri.", "icon": "calendar-clock"},
            {"title": "Dağıtım Listesi", "description": "Kontrollü kopya ve okundu onayı.", "icon": "share-2"},
        ],
    },
    "entegrasyonlar": {
        "slug": "entegrasyonlar",
        "title": "Entegrasyonlar",
        "navTitle": "Entegrasyonlar",
        "icon": "plug-zap",
        "subtitle": "ERP, MES ve IoT bağlantılarının durumu ve senkron sağlığı",
        "kpis": [
            {"key": "connectors", "label": "Aktif Bağlayıcı", "value": 9, "unit": "", "delta": 1, "deltaLabel": "+1", "description": "6 sağlıklı, 2 uyarı, 1 hata", "color": "primary"},
            {"key": "messages", "label": "Günlük Mesaj", "value": "1.2M", "unit": "", "delta": 7.8, "deltaLabel": "+7.8%", "description": "Tüm kanallar", "color": "success"},
            {"key": "failed", "label": "Başarısız Senkron", "value": 2, "unit": "", "delta": 2, "deltaLabel": "+2", "description": "Son 24 saat", "color": "danger"},
            {"key": "latency", "label": "Ort. Gecikme", "value": 340, "unit": "ms", "delta": -45, "deltaLabel": "-45 ms", "description": "Uçtan uca", "color": "accent"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Bağlayıcılar",
                "statusKey": "status",
                "columns": [
                    {"key": "system", "label": "Sistem"},
                    {"key": "type", "label": "Tür"},
                    {"key": "direction", "label": "Yön"},
                    {"key": "lastSync", "label": "Son Senkron"},
                    {"key": "latency", "label": "Gecikme", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"system": "SAP S/4HANA", "type": "ERP", "direction": "Çift yönlü", "lastSync": "21 Eyl 2026 09:15", "latency": "410 ms", "status": "Sağlıklı"},
                    {"system": "Siemens MindSphere MES", "type": "MES", "direction": "Gelen", "lastSync": "21 Eyl 2026 09:16", "latency": "180 ms", "status": "Sağlıklı"},
                    {"system": "Azure IoT Hub", "type": "IoT", "direction": "Gelen", "lastSync": "21 Eyl 2026 09:16", "latency": "95 ms", "status": "Sağlıklı"},
                    {"system": "Salesforce", "type": "CRM", "direction": "Çift yönlü", "lastSync": "21 Eyl 2026 08:50", "latency": "620 ms", "status": "Uyarı"},
                    {"system": "Logo Tiger", "type": "Muhasebe", "direction": "Giden", "lastSync": "20 Eyl 2026 23:48", "latency": "—", "status": "Hata"},
                    {"system": "Netsis", "type": "ERP (Şube)", "direction": "Gelen", "lastSync": "21 Eyl 2026 07:00", "latency": "1,120 ms", "status": "Uyarı"},
                ],
            },
            {
                "type": "cards",
                "title": "Bağlayıcı Sağlığı",
                "items": [
                    {"title": "SAP S/4HANA", "value": "99.98%", "unit": "uptime (30 gün)", "status": "Sağlıklı", "progress": 100, "meta": "OData v4 · MM, SD, PP modülleri"},
                    {"title": "Siemens MindSphere MES", "value": "99.95%", "unit": "uptime (30 gün)", "status": "Sağlıklı", "progress": 100, "meta": "REST · OEE ve iş emri akışı"},
                    {"title": "Azure IoT Hub", "value": "99.99%", "unit": "uptime (30 gün)", "status": "Sağlıklı", "progress": 100, "meta": "MQTT · 1,284 cihaz"},
                    {"title": "Salesforce", "value": "98.4%", "unit": "uptime (30 gün)", "status": "Uyarı", "progress": 98, "meta": "Bulk API kotası %91"},
                    {"title": "Logo Tiger", "value": "96.1%", "unit": "uptime (30 gün)", "status": "Hata", "progress": 96, "meta": "Kimlik doğrulama hatası (401)"},
                    {"title": "Netsis", "value": "99.2%", "unit": "uptime (30 gün)", "status": "Uyarı", "progress": 99, "meta": "Yüksek gecikme · SQL bağlantısı"},
                ],
            },
            {
                "type": "chart",
                "title": "Saatlik Mesaj Hacmi (Bin, Bugün)",
                "chartType": "area",
                "unit": "bin mesaj",
                "data": _ENTEGRASYON_CHART,
                "xKey": "hour",
                "yKeys": ["SAP", "MES", "IoT Hub"],
            },
        ],
        "toolsTitle": "Entegrasyon Araçları",
        "tools": [
            {"title": "Yeni Bağlayıcı", "description": "Hazır şablonlar: ERP, MES, IoT, CRM.", "icon": "plus-circle"},
            {"title": "API Anahtarları", "description": "Anahtar üretimi, rotasyon ve kapsam.", "icon": "key-round"},
            {"title": "Webhook Günlüğü", "description": "Gelen/giden istekler ve yeniden deneme.", "icon": "webhook"},
            {"title": "Alan Eşleme Kuralları", "description": "Sistemler arası veri dönüşüm tanımları.", "icon": "arrow-left-right"},
        ],
    },
}

# ---------------------------------------------------------------------------
# Notifications (8 items, 5 unread)
# ---------------------------------------------------------------------------
NOTIFICATIONS = [
    {"id": "n1", "title": "Titreşim eşiği aşıldı", "body": "VIB-CNC3-01 sensörü 7.8 mm/s ölçtü (z=4.6). Bakım iş emri önerildi.", "level": "err", "time": "2026-09-21T09:12:00+03:00", "read": False, "href": "/bakim"},
    {"id": "n2", "title": "Kritik stok: MX-4471", "body": "Servo Sürücü 2.2 kW stoğu 18 adet; minimum 40. Yeniden sipariş önerisi hazır.", "level": "warn", "time": "2026-09-21T08:55:00+03:00", "read": False, "href": "/stok"},
    {"id": "n3", "title": "Logo Tiger senkronu başarısız", "body": "Fatura aktarımı 2 kez 401 hatası aldı. API anahtarını kontrol edin.", "level": "err", "time": "2026-09-20T23:48:00+03:00", "read": False, "href": "/entegrasyonlar"},
    {"id": "n4", "title": "Sevkiyat teslim edildi", "body": "SVK-2026-0912 Tofaş Bursa'ya 10:05'te teslim edildi. İrsaliye onaylandı.", "level": "ok", "time": "2026-09-21T10:06:00+03:00", "read": False, "href": "/lojistik"},
    {"id": "n5", "title": "IATF 16949 yenileme denetimi", "body": "Sertifika geçerliliği 14 Kas 2026'da sona eriyor. Denetim planı 56 gün içinde tamamlanmalı.", "level": "warn", "time": "2026-09-21T07:30:00+03:00", "read": False, "href": "/belgeler"},
    {"id": "n6", "title": "Aylık finans raporu hazır", "body": "Ağustos 2026 gelir-gider raporu PDF olarak oluşturuldu.", "level": "info", "time": "2026-09-20T18:00:00+03:00", "read": True, "href": "/rapor"},
    {"id": "n7", "title": "Gece vardiyası onaylandı", "body": "21 Eyl gece vardiyası planı 128 personel ile onaylandı.", "level": "ok", "time": "2026-09-20T16:42:00+03:00", "read": True, "href": "/vardiya"},
    {"id": "n8", "title": "Yeni tedarikçi onayı", "body": "Anadolu Ambalaj Ltd. PPAP onayı tamamlandı; onaylı tedarikçi listesine eklendi.", "level": "info", "time": "2026-09-19T14:20:00+03:00", "read": True, "href": "/tedarikciler"},
]

# ---------------------------------------------------------------------------
# Audit log (GET /api/audit)
# ---------------------------------------------------------------------------
_AUDIT_RAW = [
    ("2026-09-21T09:14:22+03:00", "ahmet@ornek.com", "Rol güncellendi", "Kullanıcı: mehmet@ornek.com → Yönetici", "10.20.4.18", "Başarılı"),
    ("2026-09-21T09:02:10+03:00", "ayse@ornek.com", "Widget eklendi", "Dashboard: Enerji Tüketimi", "10.20.4.31", "Başarılı"),
    ("2026-09-21T08:47:05+03:00", "ayse@ornek.com", "Rapor dışa aktarıldı", "Aylık Finans Raporu (PDF)", "10.20.4.31", "Başarılı"),
    ("2026-09-21T08:31:44+03:00", "mehmet@ornek.com", "Senaryo çalıştırıldı", "Talep +15%, Enerji +8%", "10.20.4.44", "Başarılı"),
    ("2026-09-21T08:02:19+03:00", "bilinmiyor", "Giriş denemesi", "zeynep@ornek.com", "185.94.12.77", "Başarısız"),
    ("2026-09-21T08:01:52+03:00", "bilinmiyor", "Giriş denemesi", "zeynep@ornek.com", "185.94.12.77", "Başarısız"),
    ("2026-09-21T07:38:00+03:00", "sistem", "Senkron tamamlandı", "SAP S/4HANA · MM modülü (4,812 kayıt)", "10.20.1.5", "Başarılı"),
    ("2026-09-21T07:15:33+03:00", "zeynep@ornek.com", "Giriş yapıldı", "Web istemcisi", "10.20.4.60", "Başarılı"),
    ("2026-09-21T06:05:12+03:00", "sistem", "Zamanlanmış e-posta gönderildi", "Günlük Üretim Özeti → uretim@ornek.com", "10.20.1.5", "Başarılı"),
    ("2026-09-20T23:51:08+03:00", "mehmet@ornek.com", "Veri kaynağı silindi", "Ürün Kataloğu (CSV)", "10.20.4.44", "Başarılı"),
    ("2026-09-20T23:48:41+03:00", "sistem", "Senkron başarısız", "Logo Tiger · Fatura aktarımı (401)", "10.20.1.5", "Başarısız"),
    ("2026-09-20T21:10:27+03:00", "ali@ornek.com", "Kullanıcı pasife alındı", "Kullanıcı: stajyer@ornek.com", "10.20.4.52", "Başarılı"),
    ("2026-09-20T18:20:55+03:00", "ali@ornek.com", "Tema değiştirildi", "Vurgu rengi #c4b28d", "10.20.4.52", "Başarılı"),
    ("2026-09-20T17:44:03+03:00", "ayse@ornek.com", "Rapor oluşturuldu", "Kalite Performans Raporu", "10.20.4.31", "Başarılı"),
    ("2026-09-20T16:42:30+03:00", "hakan@ornek.com", "Vardiya planı onaylandı", "21 Eyl Gece Vardiyası (128 personel)", "10.20.4.71", "Başarılı"),
    ("2026-09-20T15:05:11+03:00", "deniz@ornek.com", "Belge revize edildi", "TL-UR-118 R3 → onaya gönderildi", "10.20.4.83", "Başarılı"),
    ("2026-09-20T14:12:48+03:00", "mehmet@ornek.com", "Veri kaynağı yüklendi", "satis_verileri_2026Q3.xlsx (12 MB)", "10.20.4.44", "Başarılı"),
    ("2026-09-20T11:30:00+03:00", "sistem", "Anomali tespit edildi", "PWR-MAIN-01 · 1,420 kW (z=2.4)", "10.20.1.5", "Başarılı"),
    ("2026-09-20T10:22:17+03:00", "ahmet@ornek.com", "API anahtarı döndürüldü", "Azure IoT Hub bağlayıcısı", "10.20.4.18", "Başarılı"),
    ("2026-09-20T09:05:39+03:00", "zeynep@ornek.com", "Rapor görüntülendi", "Aylık Finans Raporu", "10.20.4.60", "Başarılı"),
    ("2026-09-19T17:58:02+03:00", "ayse@ornek.com", "E-posta zamanlandı", "Haftalık Finans Özeti · Pazartesi 08:00", "10.20.4.31", "Başarılı"),
    ("2026-09-19T14:20:45+03:00", "deniz@ornek.com", "Tedarikçi onaylandı", "Anadolu Ambalaj Ltd. (PPAP)", "10.20.4.83", "Başarılı"),
    ("2026-09-19T12:33:21+03:00", "bilinmiyor", "Giriş denemesi", "admin", "91.203.5.14", "Başarısız"),
    ("2026-09-19T09:41:10+03:00", "ahmet@ornek.com", "Rol oluşturuldu", "Rol: Bakım Planlayıcı", "10.20.4.18", "Başarılı"),
]

AUDIT_LOG = [
    {"id": f"AUD-{26000 + len(_AUDIT_RAW) - i:05d}", "time": t, "user": u, "action": a, "target": tg, "ip": ip, "result": r}
    for i, (t, u, a, tg, ip, r) in enumerate(_AUDIT_RAW)
]

# ---------------------------------------------------------------------------
# Live feed initial state (GET /api/live random walk starts here)
# ---------------------------------------------------------------------------
LIVE_INITIAL = {
    "lines": [
        {"name": "Montaj Hattı 1", "oee": 88.0, "rate": 1150, "temp": 41.5, "status": "running"},
        {"name": "Montaj Hattı 2", "oee": 91.0, "rate": 1400, "temp": 43.2, "status": "running"},
        {"name": "Paketleme Hattı A", "oee": 75.0, "rate": 600, "temp": 36.8, "status": "stopped"},
        {"name": "CNC İşleme Merkezi", "oee": 92.0, "rate": 480, "temp": 58.4, "status": "maintenance"},
        {"name": "Pres Hattı", "oee": 84.5, "rate": 920, "temp": 52.1, "status": "running"},
    ],
    "plant": {"energyKw": 1285.0, "activeStaff": 176, "openAlerts": 23},
}
