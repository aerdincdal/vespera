# -*- coding: utf-8 -*-
"""v3 expansion: 16 more modules in three groups (Üretim Zekâsı, Finans &
Yatırım, Kurumsal). Same shapes as seed.py / seed_v2.py."""

from __future__ import annotations

_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
_LAST6 = ["Nis", "May", "Haz", "Tem", "Ağu", "Eyl"]
_DAYS7 = ["15 Eyl", "16 Eyl", "17 Eyl", "18 Eyl", "19 Eyl", "20 Eyl", "21 Eyl"]

MODULE_GROUPS_V3: list[tuple[str, list[str]]] = [
    ("Üretim Zekâsı", ["uretim-planlama", "receteler", "izlenebilirlik", "iot-sensorler", "dijital-ikiz", "kalibrasyon", "yedek-parca"]),
    ("Finans & Yatırım", ["maliyet", "butce", "projeler"]),
    ("Kurumsal", ["surdurulebilirlik", "risk-uyum", "tesisler", "arge", "egitim", "sikayetler"]),
]

# ---------------------------------------------------------------------------
# chart data
# ---------------------------------------------------------------------------
_IZLENEBILIRLIK_CHART = [
    {"day": d, "Üretilen Parti": p, "Sevk Edilen": s}
    for d, p, s in zip(_DAYS7, [38, 42, 36, 45, 41, 29, 19], [31, 39, 34, 40, 43, 27, 12])
]

_IOT_CHART = [
    {"hour": f"{h:02d}:00", "Titreşim (mm/s)": v, "Sıcaklık (°C)": t}
    for h, v, t in zip(range(0, 24, 2), [3.1, 3.0, 3.2, 3.4, 4.1, 4.8, 5.6, 6.2, 6.9, 7.4, 7.8, 7.6], [48.2, 47.9, 48.5, 49.1, 51.0, 53.4, 55.8, 57.2, 58.1, 58.9, 59.6, 59.2])
]

_MALIYET_CHART = [
    {"month": m, "Direkt Malzeme": a, "Direkt İşçilik": b, "Genel Üretim": c}
    for m, a, b, c in zip(_MONTHS, [3.9, 4.1, 4.4, 4.3, 4.6, 4.8, 4.5, 4.7, 5.0, 5.1, 5.0, 5.3], [1.4, 1.4, 1.5, 1.5, 1.6, 1.6, 1.7, 1.7, 1.7, 1.8, 1.8, 1.9], [0.9, 0.9, 1.0, 1.0, 1.0, 1.1, 1.1, 1.1, 1.2, 1.2, 1.2, 1.3])
]

_BUTCE_CHART = [
    {"month": m, "Nakit Girişi": i, "Nakit Çıkışı": o, "Net Nakit": round(i - o, 2)}
    for m, i, o in zip(_MONTHS, [9.8, 10.4, 11.2, 10.9, 11.8, 12.3, 11.6, 12.1, 12.7, 13.1, 12.9, 13.8], [8.6, 8.9, 9.4, 9.6, 9.9, 10.2, 10.0, 10.3, 10.6, 11.4, 10.8, 11.2])
]

_CO2_CHART = [
    {"month": m, "Kapsam 1": a, "Kapsam 2": b, "Hedef": h}
    for m, a, b, h in zip(_MONTHS, [412, 398, 405, 388, 376, 371, 365, 359, 348, None, None, None], [286, 279, 274, 268, 262, 255, 251, 247, 240, None, None, None], [700, 690, 680, 670, 660, 650, 640, 630, 620, 610, 600, 590])
]

_TESIS_CHART = [
    {"plant": "İstanbul (Gebze)", "OEE": 82.5, "Kalite (FPY)": 97.8},
    {"plant": "Bursa", "OEE": 86.1, "Kalite (FPY)": 98.4},
    {"plant": "İzmir", "OEE": 79.3, "Kalite (FPY)": 96.9},
    {"plant": "Gaziantep", "OEE": 74.8, "Kalite (FPY)": 95.2},
]

_SIKAYET_CHART = [
    {"week": f"H{w}", "Açılan": a, "Kapatılan": k}
    for w, a, k in zip(range(31, 39), [14, 11, 16, 9, 12, 10, 8, 13], [12, 13, 14, 11, 12, 11, 10, 9])
]

# ---------------------------------------------------------------------------
# 16 modules
# ---------------------------------------------------------------------------
MODULES_V3: dict[str, dict] = {
    # ------------------------------------------------------------- Üretim Zekâsı
    "uretim-planlama": {
        "slug": "uretim-planlama",
        "title": "Üretim Planlama & Çizelgeleme",
        "navTitle": "Üretim Planlama",
        "icon": "calendar-range",
        "subtitle": "İş emirleri, hat doluluk ve teslim tarihi uyumu",
        "kpis": [
            {"key": "openWo", "label": "Açık İş Emri", "value": 64, "unit": "", "delta": -7, "deltaLabel": "-7", "description": "Planlanan + devam eden", "color": "primary"},
            {"key": "schedAdh", "label": "Çizelgeye Uyum", "value": 91.4, "unit": "%", "delta": 2.2, "deltaLabel": "+2.2%", "description": "Zamanında başlayan iş emri", "color": "success"},
            {"key": "lineLoad", "label": "Ort. Hat Doluluk", "value": 84, "unit": "%", "delta": 3, "deltaLabel": "+3%", "description": "Sonraki 2 hafta", "color": "accent"},
            {"key": "late", "label": "Geciken Sipariş", "value": 5, "unit": "", "delta": -2, "deltaLabel": "-2", "description": "Müşteri teslim tarihini aşan", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Bu Haftanın İş Emirleri",
                "statusKey": "status",
                "columns": [
                    {"key": "wo", "label": "İş Emri"},
                    {"key": "product", "label": "Ürün"},
                    {"key": "line", "label": "Hat"},
                    {"key": "qty", "label": "Adet", "align": "right"},
                    {"key": "start", "label": "Başlangıç"},
                    {"key": "end", "label": "Bitiş"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"wo": "IE-2026-4412", "product": "MODEL-X Ana Kart", "line": "Montaj Hattı 1", "qty": 2400, "start": "21 Eyl 06:00", "end": "22 Eyl 14:00", "status": "Devam Ediyor"},
                    {"wo": "IE-2026-4413", "product": "DELTA-9 Güç Ünitesi", "line": "Montaj Hattı 2", "qty": 1800, "start": "21 Eyl 06:00", "end": "21 Eyl 22:00", "status": "Devam Ediyor"},
                    {"wo": "IE-2026-4415", "product": "OMEGA Kasa Birimi", "line": "Pres Hattı", "qty": 3200, "start": "22 Eyl 06:00", "end": "23 Eyl 14:00", "status": "Planlandı"},
                    {"wo": "IE-2026-4409", "product": "A-PLUS Sensör Modülü", "line": "CNC İşleme Merkezi", "qty": 950, "start": "19 Eyl 14:00", "end": "21 Eyl 10:00", "status": "Gecikti"},
                    {"wo": "IE-2026-4417", "product": "Konveyör Tahrik Grubu", "line": "Kaynak Hücresi", "qty": 120, "start": "23 Eyl 06:00", "end": "24 Eyl 22:00", "status": "Planlandı"},
                    {"wo": "IE-2026-4408", "product": "MODEL-X Ana Kart", "line": "Paketleme Hattı A", "qty": 2200, "start": "20 Eyl 14:00", "end": "21 Eyl 06:00", "status": "Tamamlandı"},
                ],
            },
            {
                "type": "progress",
                "title": "Hat Doluluk (Sonraki 14 Gün)",
                "items": [
                    {"label": "Montaj Hattı 1", "value": 96, "color": "danger"},
                    {"label": "Montaj Hattı 2", "value": 88, "color": "warning"},
                    {"label": "Pres Hattı", "value": 82, "color": "primary"},
                    {"label": "CNC İşleme Merkezi", "value": 91, "color": "warning"},
                    {"label": "Kaynak Hücresi", "value": 68, "color": "success"},
                    {"label": "Paketleme Hattı A", "value": 79, "color": "primary"},
                ],
            },
        ],
        "toolsTitle": "Planlama Araçları",
        "tools": [
            {"title": "Gantt Çizelgesi", "description": "Sürükle-bırak iş emri sıralama ve darboğaz görünümü.", "icon": "gantt-chart"},
            {"title": "Kapasite Planı (RCCP)", "description": "Hat ve vardiya bazlı kaba kapasite kontrolü.", "icon": "gauge"},
            {"title": "MRP Çalıştır", "description": "Malzeme ihtiyaç hesabı ve eksik listesi.", "icon": "play"},
            {"title": "Teslim Tarihi Simülasyonu", "description": "Yeni sipariş için gerçekçi termin önerisi.", "icon": "calendar-check"},
        ],
    },
    "receteler": {
        "slug": "receteler",
        "title": "Ürün Reçeteleri (BOM)",
        "navTitle": "Ürün Reçeteleri",
        "icon": "list-tree",
        "subtitle": "Çok seviyeli malzeme listeleri, maliyet ve revizyon kontrolü",
        "kpis": [
            {"key": "boms", "label": "Aktif Reçete", "value": 318, "unit": "", "delta": 9, "deltaLabel": "+9", "description": "Onaylı sürümler", "color": "primary"},
            {"key": "components", "label": "Benzersiz Bileşen", "value": "4,762", "unit": "", "delta": 84, "deltaLabel": "+84", "description": "Tüm reçetelerde", "color": "accent"},
            {"key": "pendingRev", "label": "Onay Bekleyen Revizyon", "value": 11, "unit": "", "delta": -3, "deltaLabel": "-3", "description": "Mühendislik değişikliği (ECO)", "color": "warning"},
            {"key": "costAcc", "label": "Reçete Maliyet Doğruluğu", "value": 97.6, "unit": "%", "delta": 0.8, "deltaLabel": "+0.8%", "description": "Standart / fiili", "color": "success"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "MODEL-X Ana Kart – Reçete Satırları (Rev. R6)",
                "columns": [
                    {"key": "parent", "label": "Üst SKU"},
                    {"key": "component", "label": "Bileşen"},
                    {"key": "code", "label": "Kod"},
                    {"key": "qty", "label": "Miktar", "align": "right"},
                    {"key": "unit", "label": "Birim"},
                    {"key": "supplier", "label": "Tedarikçi"},
                ],
                "rows": [
                    {"parent": "MX-1000", "component": "6 Katlı PCB FR-4", "code": "PC-2201", "qty": 1, "unit": "adet", "supplier": "Elektronik A.Ş."},
                    {"parent": "MX-1000", "component": "ARM Cortex-M7 MCU", "code": "EL-4410", "qty": 1, "unit": "adet", "supplier": "Sensortek Ltd."},
                    {"parent": "MX-1000", "component": "Servo Sürücü 2.2 kW", "code": "MX-4471", "qty": 2, "unit": "adet", "supplier": "Siemens Sanayi ve Tic. A.Ş."},
                    {"parent": "MX-1000", "component": "Alüminyum Soğutucu Blok", "code": "HM-3120", "qty": 1, "unit": "adet", "supplier": "MetalForm San. Tic."},
                    {"parent": "MX-1000", "component": "Konnektör Seti 24 pin", "code": "EL-0870", "qty": 4, "unit": "adet", "supplier": "Sensortek Ltd."},
                    {"parent": "MX-1000", "component": "Termal Macun", "code": "KM-0455", "qty": 12, "unit": "g", "supplier": "Kimya Tek Ltd."},
                ],
            },
            {
                "type": "cards",
                "title": "En Çok Üretilen 3 Ürün – Reçete Özeti",
                "items": [
                    {"title": "MODEL-X Ana Kart · MX-1000", "value": "₺2,184", "unit": "standart maliyet", "status": "Rev. R6", "meta": "38 bileşen · 3 seviye · %41 direkt malzeme"},
                    {"title": "DELTA-9 Güç Ünitesi · DL-9000", "value": "₺3,940", "unit": "standart maliyet", "status": "Rev. R4", "meta": "52 bileşen · 4 seviye · %48 direkt malzeme"},
                    {"title": "OMEGA Kasa Birimi · OM-2200", "value": "₺612", "unit": "standart maliyet", "status": "Rev. R9", "meta": "14 bileşen · 2 seviye · %63 direkt malzeme"},
                ],
            },
        ],
        "toolsTitle": "Reçete Araçları",
        "tools": [
            {"title": "Reçete Ağacı", "description": "Çok seviyeli patlatma ve nereye kullanıldı sorgusu.", "icon": "network"},
            {"title": "Mühendislik Değişikliği (ECO)", "description": "Revizyon talebi, etki analizi ve onay akışı.", "icon": "git-pull-request"},
            {"title": "Maliyet Toplama", "description": "Alt seviyeden üst seviyeye standart maliyet hesabı.", "icon": "calculator"},
            {"title": "Alternatif Bileşen", "description": "Onaylı muadil parça listesi ve tedarik riski.", "icon": "shuffle"},
        ],
    },
    "izlenebilirlik": {
        "slug": "izlenebilirlik",
        "title": "Parti & Seri İzlenebilirlik",
        "navTitle": "İzlenebilirlik",
        "icon": "route",
        "subtitle": "Hammaddeden müşteriye parti ve seri numarası takibi",
        "kpis": [
            {"key": "lotsToday", "label": "Bugün Üretilen Parti", "value": 19, "unit": "", "delta": 2, "deltaLabel": "+2", "description": "Tüm hatlar", "color": "primary"},
            {"key": "coverage", "label": "İzlenebilirlik Kapsamı", "value": 99.6, "unit": "%", "delta": 0.4, "deltaLabel": "+0.4%", "description": "Etiketli seri / toplam", "color": "success"},
            {"key": "recallTime", "label": "Geri Çağırma Simülasyon Süresi", "value": 4.2, "unit": "dk", "delta": -1.6, "deltaLabel": "-1.6 dk", "description": "Etkilenen partiyi bulma", "color": "accent"},
            {"key": "holds", "label": "Bloke Parti", "value": 3, "unit": "", "delta": 1, "deltaLabel": "+1", "description": "Kalite beklemede", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Son Partiler",
                "statusKey": "status",
                "columns": [
                    {"key": "lot", "label": "Parti No"},
                    {"key": "product", "label": "Ürün"},
                    {"key": "line", "label": "Hat"},
                    {"key": "date", "label": "Tarih"},
                    {"key": "qty", "label": "Adet", "align": "right"},
                    {"key": "status", "label": "Durum"},
                    {"key": "customer", "label": "Müşteri"},
                ],
                "rows": [
                    {"lot": "LOT-260921-A03", "product": "MODEL-X Ana Kart", "line": "Montaj Hattı 1", "date": "21 Eyl 2026", "qty": 480, "status": "Sevk Edildi", "customer": "Tofaş"},
                    {"lot": "LOT-260921-B01", "product": "DELTA-9 Güç Ünitesi", "line": "Montaj Hattı 2", "date": "21 Eyl 2026", "qty": 360, "status": "Kalite Kontrolde", "customer": "Arçelik"},
                    {"lot": "LOT-260920-P07", "product": "OMEGA Kasa Birimi", "line": "Pres Hattı", "date": "20 Eyl 2026", "qty": 1200, "status": "Depoda", "customer": "Ford Otosan"},
                    {"lot": "LOT-260920-C02", "product": "A-PLUS Sensör Modülü", "line": "CNC İşleme Merkezi", "date": "20 Eyl 2026", "qty": 240, "status": "Bloke", "customer": "Vestel"},
                    {"lot": "LOT-260919-A11", "product": "MODEL-X Ana Kart", "line": "Montaj Hattı 1", "date": "19 Eyl 2026", "qty": 500, "status": "Sevk Edildi", "customer": "Bosch"},
                    {"lot": "LOT-260919-K04", "product": "Konveyör Tahrik Grubu", "line": "Kaynak Hücresi", "date": "19 Eyl 2026", "qty": 40, "status": "Sevk Edildi", "customer": "BSH"},
                ],
            },
            {
                "type": "chart",
                "title": "Günlük Parti Akışı (Son 7 Gün)",
                "chartType": "bar",
                "unit": "parti",
                "data": _IZLENEBILIRLIK_CHART,
                "xKey": "day",
                "yKeys": ["Üretilen Parti", "Sevk Edilen"],
            },
        ],
        "toolsTitle": "İzlenebilirlik Araçları",
        "tools": [
            {"title": "Soy Ağacı Sorgusu", "description": "Seri numarasından hammadde partisine geri iz.", "icon": "git-fork"},
            {"title": "Geri Çağırma Simülasyonu", "description": "Etkilenen müşteri ve adet listesini anında üret.", "icon": "undo-2"},
            {"title": "Etiket ve Barkod", "description": "GS1-128 / QR etiket şablonları ve yazdırma.", "icon": "qr-code"},
            {"title": "Bloke Parti Yönetimi", "description": "Karantina, serbest bırakma ve hurda kararları.", "icon": "lock"},
        ],
    },
    "iot-sensorler": {
        "slug": "iot-sensorler",
        "title": "IoT Sensör İzleme",
        "navTitle": "IoT Sensörler",
        "icon": "radio",
        "subtitle": "Saha sensörlerinin anlık değerleri, eşikler ve bağlantı sağlığı",
        "kpis": [
            {"key": "sensors", "label": "Bağlı Sensör", "value": "1,284", "unit": "", "delta": 36, "deltaLabel": "+36", "description": "Azure IoT Hub üzerinden", "color": "primary"},
            {"key": "online", "label": "Çevrim İçi Oranı", "value": 99.1, "unit": "%", "delta": 0.2, "deltaLabel": "+0.2%", "description": "Son 24 saat", "color": "success"},
            {"key": "threshold", "label": "Eşik Aşımı (24 sa)", "value": 17, "unit": "", "delta": 5, "deltaLabel": "+5", "description": "Uyarı ve kritik", "color": "warning"},
            {"key": "msgRate", "label": "Mesaj Hızı", "value": "14.2K", "unit": "/dk", "delta": 6.3, "deltaLabel": "+6.3%", "description": "Ortalama telemetri", "color": "accent"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "İzlenen Kritik Sensörler",
                "statusKey": "status",
                "columns": [
                    {"key": "id", "label": "Sensör ID"},
                    {"key": "machine", "label": "Makine"},
                    {"key": "type", "label": "Tür"},
                    {"key": "value", "label": "Değer", "align": "right"},
                    {"key": "unit", "label": "Birim"},
                    {"key": "threshold", "label": "Eşik", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"id": "VIB-CNC3-01", "machine": "CNC Dik İşleme Merkezi 3", "type": "Titreşim", "value": 7.8, "unit": "mm/s", "threshold": 6.0, "status": "Kritik"},
                    {"id": "TMP-PRS2-04", "machine": "Hidrolik Pres 400 t", "type": "Sıcaklık", "value": 84, "unit": "°C", "threshold": 80, "status": "Uyarı"},
                    {"id": "CUR-WLD5-02", "machine": "Kaynak Robotu KR-16", "type": "Akım", "value": 212, "unit": "A", "threshold": 240, "status": "Normal"},
                    {"id": "PRS-CMP1-03", "machine": "Vidalı Kompresör 75 kW", "type": "Basınç", "value": 7.1, "unit": "bar", "threshold": 7.5, "status": "Normal"},
                    {"id": "FLW-HYD-02", "machine": "Hidrolik Ünite Pres Hattı", "type": "Debi", "value": 38, "unit": "L/dk", "threshold": 45, "status": "Normal"},
                    {"id": "HUM-DEP-A1", "machine": "Ana Depo A İklimlendirme", "type": "Nem", "value": 61, "unit": "%RH", "threshold": 60, "status": "Uyarı"},
                ],
            },
            {
                "type": "chart",
                "title": "VIB-CNC3-01 · Son 24 Saat Titreşim ve Sıcaklık",
                "chartType": "line",
                "data": _IOT_CHART,
                "xKey": "hour",
                "yKeys": ["Titreşim (mm/s)", "Sıcaklık (°C)"],
            },
            {
                "type": "progress",
                "title": "Sensör Tipi Dağılımı",
                "items": [
                    {"label": "Sıcaklık", "value": 34, "color": "accent"},
                    {"label": "Titreşim", "value": 22, "color": "primary"},
                    {"label": "Akım / Güç", "value": 18, "color": "secondary"},
                    {"label": "Basınç ve Debi", "value": 15, "color": "sage"},
                    {"label": "Nem, Gaz ve Diğer", "value": 11, "color": "muted"},
                ],
            },
        ],
        "toolsTitle": "Sensör Araçları",
        "tools": [
            {"title": "Eşik Yapılandırma", "description": "Sensör bazlı uyarı ve kritik eşikleri.", "icon": "sliders-horizontal"},
            {"title": "Cihaz Kaydı", "description": "Yeni sensör ekleme ve sertifika atama.", "icon": "plus-circle"},
            {"title": "Telemetri Gezgini", "description": "Ham zaman serisi sorgulama ve dışa aktarım.", "icon": "line-chart"},
            {"title": "Bağlantı Sağlığı", "description": "Ağ geçidi, sinyal ve batarya durumu.", "icon": "wifi"},
        ],
    },
    "dijital-ikiz": {
        "slug": "dijital-ikiz",
        "title": "Dijital İkiz",
        "navTitle": "Dijital İkiz",
        "icon": "boxes",
        "subtitle": "Hatların sanal modeli: simülasyon ile gerçek performans karşılaştırması",
        "kpis": [
            {"key": "twins", "label": "Aktif İkiz Modeli", "value": 6, "unit": "hat", "delta": 1, "deltaLabel": "+1", "description": "Senkron çalışan model", "color": "primary"},
            {"key": "fidelity", "label": "Model Sadakati", "value": 94.3, "unit": "%", "delta": 1.1, "deltaLabel": "+1.1%", "description": "Simülasyon / gerçek uyumu", "color": "success"},
            {"key": "simRuns", "label": "Bu Ay Senaryo Koşusu", "value": 142, "unit": "", "delta": 28, "deltaLabel": "+28", "description": "Ne-olur analizleri", "color": "accent"},
            {"key": "syncLag", "label": "Senkron Gecikmesi", "value": 2.4, "unit": "sn", "delta": -0.6, "deltaLabel": "-0.6 sn", "description": "Saha → model", "color": "warning"},
        ],
        "sections": [
            {
                "type": "cards",
                "title": "Hat İkizleri – Anlık Durum",
                "items": [
                    {"title": "Montaj Hattı 1", "value": "88.2%", "unit": "OEE (model 89.0%)", "status": "Senkron", "progress": 96, "meta": "Takt 30 sn · darboğaz: İstasyon 4"},
                    {"title": "Montaj Hattı 2", "value": "90.8%", "unit": "OEE (model 91.2%)", "status": "Senkron", "progress": 93, "meta": "Takt 24 sn · darboğaz yok"},
                    {"title": "Pres Hattı", "value": "84.0%", "unit": "OEE (model 86.5%)", "status": "Sapma", "progress": 61, "meta": "Kalıp değişimi modelden 6 dk uzun"},
                    {"title": "CNC İşleme Merkezi", "value": "92.0%", "unit": "OEE (model 92.4%)", "status": "Senkron", "progress": 80, "meta": "Takım ömrü tahmini: 3.2 saat"},
                    {"title": "Paketleme Hattı A", "value": "75.2%", "unit": "OEE (model 82.0%)", "status": "Sapma", "progress": 52, "meta": "Duruş: bant sensör arızası"},
                    {"title": "Kaynak Hücresi", "value": "86.7%", "unit": "OEE (model 86.1%)", "status": "Senkron", "progress": 68, "meta": "Robot döngü süresi 41 sn"},
                ],
            },
            {
                "type": "table",
                "title": "Simülasyon vs Gerçekleşen (Bu Hafta)",
                "statusKey": "status",
                "columns": [
                    {"key": "kpi", "label": "Gösterge"},
                    {"key": "line", "label": "Hat"},
                    {"key": "simulated", "label": "Simülasyon", "align": "right"},
                    {"key": "actual", "label": "Gerçek", "align": "right"},
                    {"key": "gap", "label": "Fark", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"kpi": "Günlük Üretim (adet)", "line": "Montaj Hattı 1", "simulated": "1,180", "actual": "1,150", "gap": "-2.5%", "status": "Uyumlu"},
                    {"kpi": "Kalıp Değişim Süresi (dk)", "line": "Pres Hattı", "simulated": 18, "actual": 24, "gap": "+33%", "status": "Sapma"},
                    {"kpi": "Enerji / Birim (kWh)", "line": "CNC İşleme Merkezi", "simulated": 2.16, "actual": 2.21, "gap": "+2.3%", "status": "Uyumlu"},
                    {"kpi": "Ara Stok (adet)", "line": "Montaj Hattı 2", "simulated": 240, "actual": 312, "gap": "+30%", "status": "Sapma"},
                    {"kpi": "Çevrim Süresi (sn)", "line": "Kaynak Hücresi", "simulated": 40, "actual": 41, "gap": "+2.5%", "status": "Uyumlu"},
                ],
            },
        ],
        "toolsTitle": "Dijital İkiz Araçları",
        "tools": [
            {"title": "Senaryo Çalıştır", "description": "Vardiya, hız ve personel değişikliğini modelde dene.", "icon": "play"},
            {"title": "3B Hat Görünümü", "description": "İstasyon bazlı canlı durum ve darboğaz ısı haritası.", "icon": "box"},
            {"title": "Model Kalibrasyonu", "description": "Saha verisiyle parametre güncelleme.", "icon": "settings-2"},
        ],
    },
    "kalibrasyon": {
        "slug": "kalibrasyon",
        "title": "Kalibrasyon Takibi",
        "navTitle": "Kalibrasyon",
        "icon": "ruler",
        "subtitle": "Ölçüm cihazları, kalibrasyon takvimi ve laboratuvar sertifikaları",
        "kpis": [
            {"key": "instruments", "label": "Kayıtlı Ölçüm Cihazı", "value": 412, "unit": "", "delta": 14, "deltaLabel": "+14", "description": "Aktif kullanımda", "color": "primary"},
            {"key": "compliance", "label": "Kalibrasyon Uyumu", "value": 97.3, "unit": "%", "delta": 1.4, "deltaLabel": "+1.4%", "description": "Süresi geçmemiş cihaz", "color": "success"},
            {"key": "dueSoon", "label": "30 Gün İçinde Dolacak", "value": 23, "unit": "", "delta": 4, "deltaLabel": "+4", "description": "Planlanması gereken", "color": "warning"},
            {"key": "overdue", "label": "Süresi Geçmiş", "value": 11, "unit": "", "delta": -5, "deltaLabel": "-5", "description": "Kullanım dışı bırakıldı", "color": "danger"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Yaklaşan Kalibrasyonlar",
                "statusKey": "status",
                "columns": [
                    {"key": "id", "label": "Cihaz ID"},
                    {"key": "type", "label": "Tür"},
                    {"key": "location", "label": "Konum"},
                    {"key": "lastCal", "label": "Son Kal."},
                    {"key": "nextCal", "label": "Sonraki Kal."},
                    {"key": "lab", "label": "Laboratuvar"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"id": "KAL-0142", "type": "Dijital Kumpas 0–300 mm", "location": "Kalite Kontrol", "lastCal": "24 Eyl 2025", "nextCal": "24 Eyl 2026", "lab": "TÜRKAK · Metrolab", "status": "3 gün kaldı"},
                    {"id": "KAL-0288", "type": "Tork Anahtarı 20–200 Nm", "location": "Montaj Hattı 1", "lastCal": "02 Eki 2025", "nextCal": "02 Eki 2026", "lab": "İç Laboratuvar", "status": "11 gün kaldı"},
                    {"id": "KAL-0311", "type": "CMM Zeiss Contura", "location": "Ölçüm Odası", "lastCal": "15 Ağu 2025", "nextCal": "15 Ağu 2026", "lab": "Zeiss Servis", "status": "Süresi Geçti"},
                    {"id": "KAL-0097", "type": "Termokupl Tip K", "location": "Isıl İşlem Fırını", "lastCal": "10 Eki 2025", "nextCal": "10 Eki 2026", "lab": "TÜBİTAK UME", "status": "19 gün kaldı"},
                    {"id": "KAL-0356", "type": "Manometre 0–16 bar", "location": "Kompresör Odası", "lastCal": "01 Mar 2026", "nextCal": "01 Mar 2027", "lab": "İç Laboratuvar", "status": "Geçerli"},
                    {"id": "KAL-0203", "type": "Yüzey Pürüzlülük Cihazı", "location": "CNC İşleme Merkezi", "lastCal": "28 Eyl 2025", "nextCal": "28 Eyl 2026", "lab": "TÜRKAK · Metrolab", "status": "7 gün kaldı"},
                ],
            },
            {
                "type": "progress",
                "title": "Kalibrasyon Uyumu – Cihaz Grubu",
                "items": [
                    {"label": "Boyutsal Ölçüm", "value": 98, "color": "success"},
                    {"label": "Tork ve Kuvvet", "value": 97, "color": "success"},
                    {"label": "Sıcaklık", "value": 95, "color": "primary"},
                    {"label": "Basınç", "value": 99, "color": "success"},
                    {"label": "Elektriksel", "value": 93, "color": "warning"},
                ],
            },
        ],
        "toolsTitle": "Kalibrasyon Araçları",
        "tools": [
            {"title": "Kalibrasyon Takvimi", "description": "Aylık plan ve laboratuvar randevuları.", "icon": "calendar-clock"},
            {"title": "Sertifika Arşivi", "description": "Kalibrasyon sertifikaları ve belirsizlik değerleri.", "icon": "file-badge"},
            {"title": "Ölçüm Sistem Analizi (MSA)", "description": "Gage R&R ve yanlılık çalışmaları.", "icon": "activity"},
            {"title": "Cihaz Zimmet", "description": "Kullanıcı ve lokasyon ataması.", "icon": "user-check"},
        ],
    },
    "yedek-parca": {
        "slug": "yedek-parca",
        "title": "Yedek Parça Stoku",
        "navTitle": "Yedek Parça",
        "icon": "package",
        "subtitle": "Makine bazlı kritik yedek parça seviyeleri ve tedarik süreleri",
        "kpis": [
            {"key": "value", "label": "Yedek Parça Stok Değeri", "value": "₺9.4M", "unit": "", "delta": 2.1, "deltaLabel": "+2.1%", "description": "Bakım deposu", "color": "primary"},
            {"key": "critical", "label": "Kritik Seviyede Parça", "value": 8, "unit": "", "delta": -2, "deltaLabel": "-2", "description": "Min. altındaki kalemler", "color": "warning"},
            {"key": "fillRate", "label": "İş Emri Karşılama Oranı", "value": 96.8, "unit": "%", "delta": 1.5, "deltaLabel": "+1.5%", "description": "Parça beklemeyen bakım", "color": "success"},
            {"key": "leadTime", "label": "Ort. Tedarik Süresi", "value": 9.5, "unit": "gün", "delta": -1.2, "deltaLabel": "-1.2 gün", "description": "Kritik parçalar", "color": "accent"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Kritik Yedek Parçalar",
                "statusKey": "status",
                "columns": [
                    {"key": "code", "label": "Kod"},
                    {"key": "name", "label": "Parça"},
                    {"key": "machine", "label": "Makine"},
                    {"key": "stock", "label": "Stok", "align": "right"},
                    {"key": "minStock", "label": "Min.", "align": "right"},
                    {"key": "leadTime", "label": "Tedarik", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"code": "YP-CNC-0412", "name": "Spindle Rulmanı 7014C", "machine": "CNC Dik İşleme Merkezi 3", "stock": 1, "minStock": 2, "leadTime": "21 gün", "status": "Kritik"},
                    {"code": "YP-PRS-0088", "name": "Hidrolik Pompa A10VSO", "machine": "Hidrolik Pres 400 t", "stock": 0, "minStock": 1, "leadTime": "35 gün", "status": "Kritik"},
                    {"code": "YP-WLD-0231", "name": "Kaynak Torcu Nozulu", "machine": "Kaynak Robotu KR-16", "stock": 48, "minStock": 30, "leadTime": "5 gün", "status": "Yeterli"},
                    {"code": "YP-CMP-0017", "name": "Hava Filtresi Kartuşu", "machine": "Vidalı Kompresör 75 kW", "stock": 3, "minStock": 4, "leadTime": "7 gün", "status": "Düşük"},
                    {"code": "YP-CVA-0155", "name": "Tahrik Motoru 3 kW", "machine": "Konveyör Hattı A", "stock": 2, "minStock": 2, "leadTime": "14 gün", "status": "Yeterli"},
                    {"code": "YP-INJ-0304", "name": "Isıtıcı Rezistans Bandı", "machine": "Enjeksiyon Makinesi 250 t", "stock": 6, "minStock": 8, "leadTime": "10 gün", "status": "Düşük"},
                ],
            },
            {
                "type": "progress",
                "title": "Yedek Parça ABC Analizi – Değer Payı",
                "items": [
                    {"label": "A Sınıfı (kritik, 96 kalem)", "value": 71, "color": "primary"},
                    {"label": "B Sınıfı (312 kalem)", "value": 21, "color": "secondary"},
                    {"label": "C Sınıfı (1,480 kalem)", "value": 8, "color": "muted"},
                ],
            },
        ],
        "toolsTitle": "Yedek Parça Araçları",
        "tools": [
            {"title": "Makine–Parça Eşlemesi", "description": "Varlık bazlı kritik parça listesi (BOM).", "icon": "link"},
            {"title": "Otomatik Sipariş Önerisi", "description": "Min/max ve tedarik süresine göre öneri.", "icon": "shopping-cart"},
            {"title": "Onarılabilir Parça Takibi", "description": "Tamire gönderilen ve dönen parçalar.", "icon": "refresh-cw"},
        ],
    },
    # ------------------------------------------------------------- Finans & Yatırım
    "maliyet": {
        "slug": "maliyet",
        "title": "Maliyet Muhasebesi",
        "navTitle": "Maliyet Muhasebesi",
        "icon": "calculator",
        "subtitle": "Masraf merkezleri, birim maliyet ve sapma analizi",
        "kpis": [
            {"key": "unitCost", "label": "Ort. Birim Maliyet", "value": "₺1,842", "unit": "", "delta": -2.3, "deltaLabel": "-2.3%", "description": "MODEL-X bazlı", "color": "primary"},
            {"key": "variance", "label": "Standart Maliyet Sapması", "value": 1.8, "unit": "%", "delta": -0.7, "deltaLabel": "-0.7%", "description": "Fiili / standart", "color": "success"},
            {"key": "overhead", "label": "Genel Üretim Gideri Oranı", "value": 17.2, "unit": "%", "delta": 0.4, "deltaLabel": "+0.4%", "description": "Toplam maliyet içinde", "color": "warning"},
            {"key": "scrap", "label": "Hurda Maliyeti (Bu Ay)", "value": "₺214K", "unit": "", "delta": -12, "deltaLabel": "-12%", "description": "Fire ve yeniden işleme", "color": "accent"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Masraf Merkezleri – Eylül 2026",
                "columns": [
                    {"key": "center", "label": "Masraf Merkezi"},
                    {"key": "code", "label": "Kod"},
                    {"key": "budget", "label": "Bütçe", "align": "right"},
                    {"key": "actual", "label": "Fiili", "align": "right"},
                    {"key": "variance", "label": "Sapma", "align": "right"},
                    {"key": "driver", "label": "Dağıtım Anahtarı"},
                ],
                "rows": [
                    {"center": "Montaj Hattı 1", "code": "MM-1010", "budget": "₺2,450,000", "actual": "₺2,388,400", "variance": "-2.5%", "driver": "Makine saati"},
                    {"center": "Pres Hattı", "code": "MM-1030", "budget": "₺1,820,000", "actual": "₺1,904,200", "variance": "+4.6%", "driver": "Ton"},
                    {"center": "CNC İşleme Merkezi", "code": "MM-1040", "budget": "₺1,360,000", "actual": "₺1,341,900", "variance": "-1.3%", "driver": "Makine saati"},
                    {"center": "Kalite Kontrol", "code": "MM-2010", "budget": "₺420,000", "actual": "₺436,800", "variance": "+4.0%", "driver": "Parti sayısı"},
                    {"center": "Bakım", "code": "MM-2020", "budget": "₺680,000", "actual": "₺612,500", "variance": "-9.9%", "driver": "Bakım saati"},
                    {"center": "Enerji ve Tesis", "code": "MM-3010", "budget": "₺960,000", "actual": "₺1,012,300", "variance": "+5.4%", "driver": "kWh"},
                ],
            },
            {
                "type": "chart",
                "title": "Maliyet Kırılımı (₺M, 12 Ay)",
                "chartType": "area",
                "unit": "₺M",
                "data": _MALIYET_CHART,
                "xKey": "month",
                "yKeys": ["Direkt Malzeme", "Direkt İşçilik", "Genel Üretim"],
            },
        ],
        "toolsTitle": "Maliyet Araçları",
        "tools": [
            {"title": "Ürün Maliyet Kartı", "description": "SKU bazlı standart ve fiili maliyet kırılımı.", "icon": "receipt"},
            {"title": "Sapma Analizi", "description": "Fiyat, miktar ve verimlilik sapmaları.", "icon": "diff"},
            {"title": "Faaliyet Tabanlı Maliyet (ABC)", "description": "Aktivite sürücüleri ve dağıtım oranları.", "icon": "pie-chart"},
            {"title": "Dönem Kapanışı", "description": "Aylık maliyet kapanış kontrol listesi.", "icon": "calendar-check"},
        ],
    },
    "butce": {
        "slug": "butce",
        "title": "Bütçe & Nakit Akışı",
        "navTitle": "Bütçe & Nakit",
        "icon": "wallet",
        "subtitle": "Departman bütçeleri, gerçekleşme ve 12 aylık nakit projeksiyonu",
        "kpis": [
            {"key": "budgetUse", "label": "Bütçe Kullanımı (YTD)", "value": 71.4, "unit": "%", "delta": -1.8, "deltaLabel": "-1.8 puan", "description": "Yılın %72'si geçti", "color": "primary"},
            {"key": "cash", "label": "Nakit Pozisyonu", "value": "₺38.2M", "unit": "", "delta": 6.4, "deltaLabel": "+6.4%", "description": "Banka + kasa", "color": "success"},
            {"key": "dso", "label": "Alacak Tahsil Süresi (DSO)", "value": 46, "unit": "gün", "delta": -3, "deltaLabel": "-3 gün", "description": "Ortalama", "color": "accent"},
            {"key": "runway", "label": "Nakit Yeterliliği", "value": 7.8, "unit": "ay", "delta": 0.5, "deltaLabel": "+0.5 ay", "description": "Mevcut yakma hızıyla", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Departman Bütçe vs Gerçekleşme (YTD)",
                "statusKey": "status",
                "columns": [
                    {"key": "department", "label": "Departman"},
                    {"key": "budget", "label": "Yıllık Bütçe", "align": "right"},
                    {"key": "actual", "label": "Gerçekleşen", "align": "right"},
                    {"key": "usage", "label": "Kullanım", "align": "right"},
                    {"key": "forecast", "label": "Yıl Sonu Tahmini", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"department": "Üretim", "budget": "₺48.0M", "actual": "₺34.6M", "usage": "72%", "forecast": "₺47.1M", "status": "Bütçede"},
                    {"department": "Bakım", "budget": "₺8.2M", "actual": "₺6.4M", "usage": "78%", "forecast": "₺8.7M", "status": "Aşım Riski"},
                    {"department": "Ar-Ge", "budget": "₺6.5M", "actual": "₺4.1M", "usage": "63%", "forecast": "₺6.0M", "status": "Bütçede"},
                    {"department": "Satış ve Pazarlama", "budget": "₺5.4M", "actual": "₺4.3M", "usage": "80%", "forecast": "₺5.9M", "status": "Aşım Riski"},
                    {"department": "İnsan Kaynakları", "budget": "₺3.1M", "actual": "₺2.1M", "usage": "68%", "forecast": "₺3.0M", "status": "Bütçede"},
                    {"department": "Bilgi Teknolojileri", "budget": "₺4.8M", "actual": "₺3.9M", "usage": "81%", "forecast": "₺5.3M", "status": "Aşım"},
                ],
            },
            {
                "type": "chart",
                "title": "Nakit Akışı (₺M, 12 Ay)",
                "chartType": "area",
                "unit": "₺M",
                "data": _BUTCE_CHART,
                "xKey": "month",
                "yKeys": ["Nakit Girişi", "Nakit Çıkışı", "Net Nakit"],
            },
        ],
        "toolsTitle": "Bütçe Araçları",
        "tools": [
            {"title": "Bütçe Revizyonu", "description": "Çeyrek bazlı yeniden tahmin ve onay.", "icon": "file-edit"},
            {"title": "Nakit Projeksiyonu", "description": "13 haftalık haftalık nakit akış tahmini.", "icon": "trending-up"},
            {"title": "Alacak ve Borç Yaşlandırma", "description": "Vade bazlı tahsilat ve ödeme planı.", "icon": "hourglass"},
            {"title": "Onay Limitleri", "description": "Harcama yetkisi ve tutar eşikleri.", "icon": "shield"},
        ],
    },
    "projeler": {
        "slug": "projeler",
        "title": "Proje & Yatırım (CAPEX) Takibi",
        "navTitle": "Proje & Yatırım",
        "icon": "briefcase",
        "subtitle": "Yatırım projeleri, harcama ilerlemesi ve geri dönüş süresi",
        "kpis": [
            {"key": "active", "label": "Aktif Proje", "value": 12, "unit": "", "delta": 2, "deltaLabel": "+2", "description": "Onaylı yatırım projeleri", "color": "primary"},
            {"key": "capex", "label": "Toplam CAPEX Bütçesi", "value": "₺124M", "unit": "", "delta": 18, "deltaLabel": "+18%", "description": "2026 yatırım planı", "color": "accent"},
            {"key": "spent", "label": "Harcama Gerçekleşmesi", "value": 58, "unit": "%", "delta": 9, "deltaLabel": "+9 puan", "description": "Bütçeye göre", "color": "success"},
            {"key": "delayed", "label": "Takvim Gerisinde", "value": 3, "unit": "proje", "delta": 1, "deltaLabel": "+1", "description": "30+ gün gecikme", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Yatırım Projeleri",
                "statusKey": "status",
                "progressKey": "progress",
                "columns": [
                    {"key": "project", "label": "Proje"},
                    {"key": "budget", "label": "Bütçe", "align": "right"},
                    {"key": "spent", "label": "Harcanan", "align": "right"},
                    {"key": "progress", "label": "İlerleme %", "align": "right"},
                    {"key": "owner", "label": "Sorumlu"},
                    {"key": "due", "label": "Bitiş"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"project": "Yeni SMT Hattı (Montaj 3)", "budget": "₺42.0M", "spent": "₺27.3M", "progress": 65, "owner": "Hakan Öztürk", "due": "Mar 2027", "status": "Yolunda"},
                    {"project": "Çatı GES 2.4 MWp", "budget": "₺28.5M", "spent": "₺24.1M", "progress": 85, "owner": "Mehmet Kaya", "due": "Kas 2026", "status": "Yolunda"},
                    {"project": "Otomatik Depo (AS/RS)", "budget": "₺31.0M", "spent": "₺9.6M", "progress": 28, "owner": "Ayşe Demir", "due": "Haz 2027", "status": "Gecikti"},
                    {"project": "MES Yaygınlaştırma Faz 2", "budget": "₺6.8M", "spent": "₺4.9M", "progress": 72, "owner": "Selin Aydın", "due": "Ara 2026", "status": "Yolunda"},
                    {"project": "Kaynak Robot Hücresi 2", "budget": "₺9.2M", "spent": "₺2.1M", "progress": 18, "owner": "Emre Kılıç", "due": "Nis 2027", "status": "Gecikti"},
                    {"project": "Atık Isı Geri Kazanım", "budget": "₺6.5M", "spent": "₺3.8M", "progress": 55, "owner": "Mehmet Kaya", "due": "Şub 2027", "status": "Yolunda"},
                ],
            },
            {
                "type": "progress",
                "title": "Proje Fazı Dağılımı (12 Proje)",
                "items": [
                    {"label": "Fikir ve Fizibilite", "value": 17, "color": "muted"},
                    {"label": "Onaylandı, Tedarik", "value": 25, "color": "secondary"},
                    {"label": "Kurulum ve Devreye Alma", "value": 42, "color": "primary"},
                    {"label": "Kapanış ve Değerlendirme", "value": 16, "color": "success"},
                ],
            },
        ],
        "toolsTitle": "Proje Araçları",
        "tools": [
            {"title": "Yatırım Talebi", "description": "Fizibilite, NPV/IRR hesabı ve onay akışı.", "icon": "file-plus"},
            {"title": "Proje Takvimi", "description": "Kilometre taşları ve bağımlılıklar.", "icon": "gantt-chart"},
            {"title": "Harcama Takibi", "description": "Sipariş, hakediş ve fatura eşleşmesi.", "icon": "receipt"},
            {"title": "Faydalandırma Raporu", "description": "Yatırım sonrası gerçekleşen tasarruf ölçümü.", "icon": "badge-check"},
        ],
    },
    # ------------------------------------------------------------- Kurumsal
    "surdurulebilirlik": {
        "slug": "surdurulebilirlik",
        "title": "Sürdürülebilirlik & ESG",
        "navTitle": "Sürdürülebilirlik & ESG",
        "icon": "leaf",
        "subtitle": "Karbon ayak izi, su ve atık göstergeleri ile ESG hedef takibi",
        "kpis": [
            {"key": "co2", "label": "CO₂e Emisyonu (YTD)", "value": "5,412", "unit": "ton", "delta": -11.2, "deltaLabel": "-11.2%", "description": "Kapsam 1 + 2", "color": "success"},
            {"key": "renewable", "label": "Yenilenebilir Enerji Payı", "value": 34, "unit": "%", "delta": 9, "deltaLabel": "+9 puan", "description": "GES + YEK-G sertifikalı", "color": "primary"},
            {"key": "water", "label": "Su Tüketimi / Birim", "value": 3.8, "unit": "L", "delta": -6.5, "deltaLabel": "-6.5%", "description": "Üretilen birim başına", "color": "accent"},
            {"key": "esg", "label": "ESG Skoru", "value": "B+", "unit": "", "delta": 1, "deltaLabel": "+1 kademe", "description": "EcoVadis 2026", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "ESG Göstergeleri – Hedef Karşılaştırması",
                "statusKey": "status",
                "columns": [
                    {"key": "metric", "label": "Gösterge"},
                    {"key": "pillar", "label": "Sütun"},
                    {"key": "actual", "label": "Gerçekleşen", "align": "right"},
                    {"key": "target", "label": "2026 Hedefi", "align": "right"},
                    {"key": "unit", "label": "Birim"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"metric": "Karbon Yoğunluğu", "pillar": "Çevre", "actual": 0.42, "target": 0.40, "unit": "tCO₂e / ₺M ciro", "status": "Yaklaşıyor"},
                    {"metric": "Atık Geri Dönüşüm Oranı", "pillar": "Çevre", "actual": 75, "target": 80, "unit": "%", "status": "Yaklaşıyor"},
                    {"metric": "Tehlikeli Atık", "pillar": "Çevre", "actual": 38.4, "target": 36.0, "unit": "ton", "status": "Hedef Gerisi"},
                    {"metric": "Kadın Çalışan Oranı", "pillar": "Sosyal", "actual": 31, "target": 35, "unit": "%", "status": "Yaklaşıyor"},
                    {"metric": "LTIFR", "pillar": "Sosyal", "actual": 0.82, "target": 1.00, "unit": "", "status": "Hedefe Ulaşıldı"},
                    {"metric": "Etik Eğitimi Tamamlama", "pillar": "Yönetişim", "actual": 98, "target": 100, "unit": "%", "status": "Yaklaşıyor"},
                ],
            },
            {
                "type": "chart",
                "title": "Aylık CO₂e Emisyonu (ton, 2026)",
                "chartType": "line",
                "unit": "ton",
                "data": _CO2_CHART,
                "xKey": "month",
                "yKeys": ["Kapsam 1", "Kapsam 2", "Hedef"],
            },
        ],
        "toolsTitle": "ESG Araçları",
        "tools": [
            {"title": "Karbon Envanteri", "description": "ISO 14064 uyumlu Kapsam 1-2-3 hesaplama.", "icon": "cloud"},
            {"title": "CSRD / TSRS Raporu", "description": "Sürdürülebilirlik raporlama şablonları.", "icon": "file-text"},
            {"title": "Tedarikçi ESG Anketi", "description": "Tedarik zinciri sürdürülebilirlik değerlendirmesi.", "icon": "clipboard-list"},
            {"title": "Hedef ve Yol Haritası", "description": "SBTi uyumlu azaltım planı.", "icon": "flag"},
        ],
    },
    "risk-uyum": {
        "slug": "risk-uyum",
        "title": "Risk & Uyum Yönetimi",
        "navTitle": "Risk & Uyum",
        "icon": "shield-check",
        "subtitle": "Kurumsal risk kaydı, uyum sertifikaları ve denetim bulguları",
        "kpis": [
            {"key": "risks", "label": "Açık Risk Kaydı", "value": 34, "unit": "", "delta": -4, "deltaLabel": "-4", "description": "Kurumsal risk kütüğü", "color": "primary"},
            {"key": "highRisks", "label": "Yüksek Skorlu Risk", "value": 6, "unit": "", "delta": -1, "deltaLabel": "-1", "description": "Skor ≥ 15", "color": "danger"},
            {"key": "findings", "label": "Açık Denetim Bulgusu", "value": 9, "unit": "", "delta": -5, "deltaLabel": "-5", "description": "İç ve dış denetim", "color": "warning"},
            {"key": "compliance", "label": "Uyum Skoru", "value": 94, "unit": "%", "delta": 2, "deltaLabel": "+2%", "description": "Yasal ve standart gereklilikler", "color": "success"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Risk Kütüğü – En Yüksek Skorlar",
                "statusKey": "level",
                "columns": [
                    {"key": "risk", "label": "Risk"},
                    {"key": "category", "label": "Kategori"},
                    {"key": "probability", "label": "Olasılık", "align": "right"},
                    {"key": "impact", "label": "Etki", "align": "right"},
                    {"key": "score", "label": "Skor", "align": "right"},
                    {"key": "owner", "label": "Sahip"},
                    {"key": "level", "label": "Seviye"},
                ],
                "rows": [
                    {"risk": "Tek kaynaklı servo sürücü tedariki", "category": "Tedarik Zinciri", "probability": 4, "impact": 5, "score": 20, "owner": "Ayşe Demir", "level": "Yüksek"},
                    {"risk": "Elektrik fiyat volatilitesi", "category": "Finansal", "probability": 4, "impact": 4, "score": 16, "owner": "Mehmet Kaya", "level": "Yüksek"},
                    {"risk": "Siber saldırı – OT ağı", "category": "Bilgi Güvenliği", "probability": 3, "impact": 5, "score": 15, "owner": "Ahmet Yılmaz", "level": "Yüksek"},
                    {"risk": "IATF 16949 yenileme denetimi bulguları", "category": "Uyum", "probability": 3, "impact": 4, "score": 12, "owner": "Deniz Arslan", "level": "Orta"},
                    {"risk": "Kritik personel kaybı (CNC ustaları)", "category": "İnsan Kaynakları", "probability": 3, "impact": 3, "score": 9, "owner": "Zeynep Şahin", "level": "Orta"},
                    {"risk": "Deprem – Gebze tesisi", "category": "Operasyonel", "probability": 2, "impact": 5, "score": 10, "owner": "Burak Şen", "level": "Orta"},
                ],
            },
            {
                "type": "cards",
                "title": "Uyum Sertifikaları",
                "items": [
                    {"title": "ISO 9001:2015", "value": "Geçerli", "unit": "Geçerlilik: 05 Şub 2028", "status": "Aktif", "progress": 100, "meta": "Kalite Yönetim Sistemi · Bulgu: 0"},
                    {"title": "ISO 14001:2015", "value": "Geçerli", "unit": "Geçerlilik: 09 Eyl 2027", "status": "Aktif", "progress": 100, "meta": "Çevre Yönetim Sistemi · Bulgu: 1 minör"},
                    {"title": "ISO 45001:2018", "value": "Geçerli", "unit": "Geçerlilik: 22 Mar 2028", "status": "Aktif", "progress": 100, "meta": "İSG Yönetim Sistemi · Bulgu: 0"},
                    {"title": "IATF 16949:2016", "value": "56 gün", "unit": "Yenileme: 14 Kas 2026", "status": "Yaklaşıyor", "progress": 62, "meta": "Otomotiv KYS · Açık bulgu: 3 minör"},
                ],
            },
        ],
        "toolsTitle": "Risk ve Uyum Araçları",
        "tools": [
            {"title": "Risk Kütüğü", "description": "Yeni risk, olasılık-etki matrisi ve aksiyon planı.", "icon": "shield-alert"},
            {"title": "Denetim Bulguları", "description": "İç/dış denetim bulguları ve DÖF takibi.", "icon": "clipboard-check"},
            {"title": "Mevzuat Takibi", "description": "Yasal değişiklikler ve uyum aksiyonları.", "icon": "scale"},
            {"title": "İş Sürekliliği Planı", "description": "Kritik süreçler ve kurtarma senaryoları.", "icon": "life-buoy"},
        ],
    },
    "tesisler": {
        "slug": "tesisler",
        "title": "Çoklu Tesis Karşılaştırma",
        "navTitle": "Çoklu Tesis",
        "icon": "building-2",
        "subtitle": "Dört üretim tesisinin OEE, çıktı, enerji ve kalite karşılaştırması",
        "kpis": [
            {"key": "plants", "label": "Aktif Tesis", "value": 4, "unit": "", "delta": 0, "deltaLabel": "", "description": "İstanbul, Bursa, İzmir, Gaziantep", "color": "primary"},
            {"key": "groupOee", "label": "Grup OEE", "value": 80.7, "unit": "%", "delta": 1.3, "deltaLabel": "+1.3%", "description": "Ağırlıklı ortalama", "color": "success"},
            {"key": "output", "label": "Toplam Üretim (Bu Ay)", "value": "58,900", "unit": "birim", "delta": 4.8, "deltaLabel": "+4.8%", "description": "Tüm tesisler", "color": "accent"},
            {"key": "bestWorst", "label": "En İyi / En Düşük OEE Farkı", "value": 11.3, "unit": "puan", "delta": -1.6, "deltaLabel": "-1.6", "description": "Bursa vs Gaziantep", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Tesis Karşılaştırma Tablosu (Eylül 2026)",
                "columns": [
                    {"key": "plant", "label": "Tesis"},
                    {"key": "oee", "label": "OEE", "align": "right"},
                    {"key": "output", "label": "Üretim", "align": "right"},
                    {"key": "energy", "label": "kWh / Birim", "align": "right"},
                    {"key": "quality", "label": "FPY", "align": "right"},
                    {"key": "staff", "label": "Personel", "align": "right"},
                    {"key": "trend", "label": "Trend"},
                ],
                "rows": [
                    {"plant": "İstanbul (Gebze)", "oee": "82.5%", "output": "17,450", "energy": 2.21, "quality": "97.8%", "staff": 485, "trend": "Yükseliş"},
                    {"plant": "Bursa", "oee": "86.1%", "output": "21,300", "energy": 2.04, "quality": "98.4%", "staff": 612, "trend": "Yükseliş"},
                    {"plant": "İzmir", "oee": "79.3%", "output": "12,800", "energy": 2.38, "quality": "96.9%", "staff": 340, "trend": "Yatay"},
                    {"plant": "Gaziantep", "oee": "74.8%", "output": "7,350", "energy": 2.61, "quality": "95.2%", "staff": 228, "trend": "Düşüş"},
                ],
            },
            {
                "type": "chart",
                "title": "Tesis Bazlı OEE ve İlk Seferde Kalite (%)",
                "chartType": "bar",
                "unit": "%",
                "data": _TESIS_CHART,
                "xKey": "plant",
                "yKeys": ["OEE", "Kalite (FPY)"],
            },
        ],
        "toolsTitle": "Tesis Araçları",
        "tools": [
            {"title": "Kıyaslama Raporu", "description": "Tesisler arası en iyi uygulama karşılaştırması.", "icon": "bar-chart-3"},
            {"title": "Kapasite Dengeleme", "description": "Siparişleri tesisler arasında yeniden dağıt.", "icon": "scale"},
            {"title": "Tesis Kartı", "description": "Lokasyon, hat sayısı, sertifikalar ve yönetim.", "icon": "building"},
        ],
    },
    "arge": {
        "slug": "arge",
        "title": "Ar-Ge & Ürün Geliştirme",
        "navTitle": "Ar-Ge",
        "icon": "flask-conical",
        "subtitle": "Ar-Ge projeleri, teknoloji hazırlık seviyeleri ve patent portföyü",
        "kpis": [
            {"key": "projects", "label": "Aktif Ar-Ge Projesi", "value": 14, "unit": "", "delta": 3, "deltaLabel": "+3", "description": "TÜBİTAK destekli 5", "color": "primary"},
            {"key": "rdRatio", "label": "Ar-Ge Harcaması / Ciro", "value": 4.2, "unit": "%", "delta": 0.6, "deltaLabel": "+0.6 puan", "description": "YTD", "color": "accent"},
            {"key": "patents", "label": "Patent Portföyü", "value": 27, "unit": "", "delta": 4, "deltaLabel": "+4", "description": "Tescilli + başvuru", "color": "success"},
            {"key": "ttm", "label": "Ort. Pazara Çıkış Süresi", "value": 14, "unit": "ay", "delta": -2, "deltaLabel": "-2 ay", "description": "Konsept → seri üretim", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Ar-Ge Proje Portföyü",
                "statusKey": "status",
                "progressKey": "progress",
                "columns": [
                    {"key": "project", "label": "Proje"},
                    {"key": "trl", "label": "TRL", "align": "right"},
                    {"key": "stage", "label": "Aşama"},
                    {"key": "lead", "label": "Proje Lideri"},
                    {"key": "budget", "label": "Bütçe", "align": "right"},
                    {"key": "progress", "label": "İlerleme %", "align": "right"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"project": "MODEL-X Gen2 Yüksek Verim Sürücü", "trl": 7, "stage": "Pilot Üretim", "lead": "Dr. Elif Karaca", "budget": "₺4.8M", "progress": 78, "status": "Yolunda"},
                    {"project": "SiC Tabanlı Güç Modülü", "trl": 5, "stage": "Prototip Doğrulama", "lead": "Cem Aksoy", "budget": "₺3.2M", "progress": 52, "status": "Yolunda"},
                    {"project": "Öngörücü Bakım Sensör Paketi", "trl": 8, "stage": "Seri Üretim Hazırlığı", "lead": "Selin Aydın", "budget": "₺1.9M", "progress": 91, "status": "Yolunda"},
                    {"project": "Geri Dönüştürülmüş Alüminyum Kasa", "trl": 4, "stage": "Laboratuvar Doğrulama", "lead": "Murat Koç", "budget": "₺1.1M", "progress": 34, "status": "Risk Altında"},
                    {"project": "Kablosuz Enerji İzleme Modülü", "trl": 3, "stage": "Kavram Kanıtı", "lead": "Dr. Elif Karaca", "budget": "₺0.8M", "progress": 18, "status": "Yolunda"},
                    {"project": "Kompakt Konveyör Tahrik Ünitesi", "trl": 6, "stage": "Sistem Prototipi", "lead": "Emre Kılıç", "budget": "₺2.4M", "progress": 61, "status": "Gecikti"},
                ],
            },
            {
                "type": "progress",
                "title": "Portföy Aşama Dağılımı (14 Proje)",
                "items": [
                    {"label": "Kavram ve Fizibilite (TRL 1–3)", "value": 21, "color": "muted"},
                    {"label": "Laboratuvar Doğrulama (TRL 4–5)", "value": 29, "color": "secondary"},
                    {"label": "Prototip ve Pilot (TRL 6–7)", "value": 36, "color": "primary"},
                    {"label": "Seri Üretim Hazırlığı (TRL 8–9)", "value": 14, "color": "success"},
                ],
            },
        ],
        "toolsTitle": "Ar-Ge Araçları",
        "tools": [
            {"title": "Proje Kapı Değerlendirmesi", "description": "Aşama geçiş kriterleri ve karar toplantıları.", "icon": "door-open"},
            {"title": "Patent ve Fikri Mülkiyet", "description": "Başvuru takibi ve rakip patent taraması.", "icon": "lightbulb"},
            {"title": "Teşvik ve Hibe Takibi", "description": "TÜBİTAK, KOSGEB ve AB Horizon başvuruları.", "icon": "hand-coins"},
            {"title": "Test Laboratuvarı Rezervasyon", "description": "EMC, iklim ve titreşim test takvimi.", "icon": "flask-conical"},
        ],
    },
    "egitim": {
        "slug": "egitim",
        "title": "Eğitim & Yetkinlik Matrisi",
        "navTitle": "Eğitim & Yetkinlik",
        "icon": "graduation-cap",
        "subtitle": "Planlı eğitimler, sertifika geçerliliği ve hat bazlı yetkinlik kapsamı",
        "kpis": [
            {"key": "hours", "label": "Eğitim Saati (YTD)", "value": "11,640", "unit": "saat", "delta": 12, "deltaLabel": "+12%", "description": "Kişi başı 24 saat", "color": "primary"},
            {"key": "completion", "label": "Zorunlu Eğitim Tamamlama", "value": 96, "unit": "%", "delta": 2, "deltaLabel": "+2%", "description": "İSG, kalite, etik", "color": "success"},
            {"key": "coverage", "label": "Yetkinlik Kapsamı", "value": 88, "unit": "%", "delta": 4, "deltaLabel": "+4 puan", "description": "Hat gereksinimi karşılanan", "color": "accent"},
            {"key": "expiring", "label": "Süresi Dolacak Sertifika", "value": 27, "unit": "", "delta": 6, "deltaLabel": "+6", "description": "60 gün içinde", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Planlı ve Devam Eden Eğitimler",
                "statusKey": "status",
                "columns": [
                    {"key": "training", "label": "Eğitim"},
                    {"key": "type", "label": "Tür"},
                    {"key": "audience", "label": "Hedef Kitle"},
                    {"key": "date", "label": "Tarih"},
                    {"key": "participants", "label": "Katılımcı", "align": "right"},
                    {"key": "trainer", "label": "Eğitmen"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"training": "IATF 16949 Temel Araçlar (APQP, FMEA, SPC)", "type": "Kalite", "audience": "Kalite ve Üretim Mühendisleri", "date": "23–24 Eyl 2026", "participants": 18, "trainer": "TSE Eğitim", "status": "Planlandı"},
                    {"training": "Forklift Operatörlüğü Yenileme", "type": "İSG", "audience": "Depo Operatörleri", "date": "22 Eyl 2026", "participants": 24, "trainer": "MEB Onaylı Kurum", "status": "Planlandı"},
                    {"training": "CNC Programlama İleri Seviye", "type": "Teknik", "audience": "CNC Operatörleri", "date": "15–19 Eyl 2026", "participants": 12, "trainer": "Siemens Sinumerik", "status": "Devam Ediyor"},
                    {"training": "Yalın Üretim ve Kaizen", "type": "Süreç", "audience": "Hat Amirleri", "date": "10 Eyl 2026", "participants": 22, "trainer": "İç Eğitmen · H. Öztürk", "status": "Tamamlandı"},
                    {"training": "Elektrik Yüksek Gerilim Yetkilendirme", "type": "İSG", "audience": "Bakım Teknisyenleri", "date": "29 Eyl 2026", "participants": 9, "trainer": "EMO Eğitim", "status": "Planlandı"},
                    {"training": "KVKK ve Bilgi Güvenliği Farkındalığı", "type": "Uyum", "audience": "Tüm Ofis Personeli", "date": "Eylül 2026 (e-öğrenme)", "participants": 160, "trainer": "Çevrim İçi", "status": "Devam Ediyor"},
                ],
            },
            {
                "type": "progress",
                "title": "Hat Bazlı Yetkinlik Kapsamı",
                "items": [
                    {"label": "Montaj Hattı 1", "value": 94, "color": "success"},
                    {"label": "Montaj Hattı 2", "value": 90, "color": "success"},
                    {"label": "CNC İşleme Merkezi", "value": 82, "color": "primary"},
                    {"label": "Pres Hattı", "value": 86, "color": "primary"},
                    {"label": "Kaynak Hücresi", "value": 78, "color": "warning"},
                    {"label": "Bakım Ekibi", "value": 91, "color": "success"},
                ],
            },
        ],
        "toolsTitle": "Eğitim Araçları",
        "tools": [
            {"title": "Yetkinlik Matrisi", "description": "Personel × beceri ızgarası ve boşluk analizi.", "icon": "grid-3x3"},
            {"title": "Eğitim Kataloğu", "description": "İç ve dış eğitimler, e-öğrenme içerikleri.", "icon": "book-open"},
            {"title": "Sertifika Takibi", "description": "Yasal zorunlu sertifikalar ve yenileme tarihleri.", "icon": "file-badge"},
            {"title": "Eğitim Etkinliği Ölçümü", "description": "Kirkpatrick seviyeleri ve saha uygulama takibi.", "icon": "bar-chart-3"},
        ],
    },
    "sikayetler": {
        "slug": "sikayetler",
        "title": "Müşteri Şikayet & Servis",
        "navTitle": "Şikayet & Servis",
        "icon": "message-square-warning",
        "subtitle": "Servis talepleri, SLA uyumu ve 8D kök neden takibi",
        "kpis": [
            {"key": "open", "label": "Açık Talep", "value": 31, "unit": "", "delta": -5, "deltaLabel": "-5", "description": "Şikayet + servis", "color": "primary"},
            {"key": "sla", "label": "SLA Uyumu", "value": 93.6, "unit": "%", "delta": 1.8, "deltaLabel": "+1.8%", "description": "Süresinde kapanan", "color": "success"},
            {"key": "mttr", "label": "Ort. Çözüm Süresi", "value": 2.4, "unit": "gün", "delta": -0.7, "deltaLabel": "-0.7 gün", "description": "Açılış → kapanış", "color": "accent"},
            {"key": "csat", "label": "Servis Memnuniyeti", "value": 4.6, "unit": "/5", "delta": 0.2, "deltaLabel": "+0.2", "description": "Kapanış anketi", "color": "warning"},
        ],
        "sections": [
            {
                "type": "table",
                "title": "Açık Servis Talepleri",
                "statusKey": "priority",
                "columns": [
                    {"key": "ticket", "label": "Talep No"},
                    {"key": "customer", "label": "Müşteri"},
                    {"key": "product", "label": "Ürün"},
                    {"key": "issue", "label": "Konu"},
                    {"key": "priority", "label": "Öncelik"},
                    {"key": "sla", "label": "SLA"},
                    {"key": "status", "label": "Durum"},
                ],
                "rows": [
                    {"ticket": "SRV-2026-0871", "customer": "Tofaş", "product": "MODEL-X Ana Kart", "issue": "Sahada haberleşme kopması (LOT-260919-A11)", "priority": "Kritik", "sla": "6 sa kaldı", "status": "8D – D4 Kök Neden"},
                    {"ticket": "SRV-2026-0868", "customer": "Arçelik", "product": "DELTA-9 Güç Ünitesi", "issue": "Aşırı ısınma uyarısı", "priority": "Yüksek", "sla": "1 gün kaldı", "status": "Saha Servisi Atandı"},
                    {"ticket": "SRV-2026-0864", "customer": "Vestel", "product": "A-PLUS Sensör Modülü", "issue": "Kalibrasyon sapması", "priority": "Orta", "sla": "3 gün kaldı", "status": "Numune Bekleniyor"},
                    {"ticket": "SRV-2026-0859", "customer": "Ford Otosan", "product": "OMEGA Kasa Birimi", "issue": "Boya yüzey hatası", "priority": "Düşük", "sla": "5 gün kaldı", "status": "İnceleniyor"},
                    {"ticket": "SRV-2026-0852", "customer": "Bosch", "product": "MODEL-X Ana Kart", "issue": "Eksik konnektör (paketleme)", "priority": "Orta", "sla": "Aşıldı", "status": "Yedek Sevk Edildi"},
                    {"ticket": "SRV-2026-0847", "customer": "BSH", "product": "Konveyör Tahrik Grubu", "issue": "Rulman sesi – garanti", "priority": "Yüksek", "sla": "2 gün kaldı", "status": "Onarımda"},
                ],
            },
            {
                "type": "chart",
                "title": "Haftalık Talep Akışı (Son 8 Hafta)",
                "chartType": "bar",
                "unit": "talep",
                "data": _SIKAYET_CHART,
                "xKey": "week",
                "yKeys": ["Açılan", "Kapatılan"],
            },
            {
                "type": "progress",
                "title": "Şikayet Kök Neden Dağılımı (YTD)",
                "items": [
                    {"label": "Üretim Hatası", "value": 38, "color": "danger"},
                    {"label": "Tedarikçi Kaynaklı", "value": 27, "color": "warning"},
                    {"label": "Tasarım", "value": 14, "color": "accent"},
                    {"label": "Lojistik ve Paketleme", "value": 12, "color": "secondary"},
                    {"label": "Kullanım Hatası", "value": 9, "color": "muted"},
                ],
            },
        ],
        "toolsTitle": "Servis Araçları",
        "tools": [
            {"title": "Yeni Servis Talebi", "description": "Müşteri portalı ve çağrı merkezi kaydı.", "icon": "plus-circle"},
            {"title": "8D Raporu", "description": "Disiplinli problem çözme ve müşteri onayı.", "icon": "file-text"},
            {"title": "Garanti Takibi", "description": "Seri numarası bazlı garanti ve maliyet.", "icon": "shield-check"},
            {"title": "Saha Servis Planlama", "description": "Teknisyen rota ve yedek parça ataması.", "icon": "map-pin"},
        ],
    },
}
