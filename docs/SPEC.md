# VESPERA – Fabrika Yönetim Platformu · Video Analizi ve Ürün Spesifikasyonu

Kaynak: `video/reference.mp4` (80 sn). Kareler: `video/frames/`, ekran başına büyütülmüş kareler: `video/key/`.
Hedef: Aynı donanım (tüm ekranlar, tüm bileşenler), **daha modern** görünüm. Stack: Next.js (App Router, TS) + shadcn/ui + Tailwind + Recharts + react-leaflet · FastAPI backend (simüle veri).

---

## 1. Genel Yerleşim (her ekranda aynı)

- **Sol sidebar** (sabit, ~240px, daraltılabilir): Üstte logo (bar-chart ikonu + "VESPERA"). Altta 4 grup başlığı (küçük, gri, büyük harf):
  1. **GENEL**: Ana Panel (Chatbot) · Genel Dashboard
  2. **FABRİKA YÖNETİMİ**: Finansal Yönetim · Üretim & Operasyonlar · İnsan Kaynakları · Satış & Pazarlama · Envanter & Tedarik Zinciri · Kalite Yönetimi · Bakım Yönetimi · Enerji & Çevre · Stratejik Analizler
  3. **ANALİZ ARAÇLARI**: Detaylı Analiz · Senaryo Analizi · Harita Entegrasyonu
  4. **AYARLAR & YAPILANDIRMA**: Kişisel Dashboard · Tema Özelleştirme · Yetki Yönetimi · Rapor Oluşturma · E-posta Gönderimi · Veri Kaynakları
  - Aktif öğe: dolgu mavi (#0ea5e9), beyaz metin, yuvarlatılmış.
  - Sidebar en altında küçük gri footer: "© 2026 App On Inc.".
- **Üst bar**: hamburger ikonu + "VESPERA" başlık; sağda bildirim zili (kırmızı nokta), ayar dişlisi, avatar.
- **Sayfa başlığı**: Modül sayfalarında büyük mavi başlık, solunda modül ikonu (örn. 🏛 Finansal Yönetim Merkezi). Ayar sayfalarında beyaz başlık, sağda aksiyon butonları.

## 2. Renk Paleti (videodaki Tema ekranından okundu)

| Rol | Hex |
|---|---|
| Ana renk (primary) | #0ea5e9 |
| İkincil renk | #38bdf8 |
| Vurgu (accent) | #f97316 |
| Başarı | #4ade80 |
| Uyarı | #facc15 |
| Hata | #ef4444 |
| Arka plan (page) | #111827 → videoda daha lacivert görünüyor, hedef: #0b1628 |
| Kart arka planı | #1f2937 → hedef: #132238 |
| Metin | #e5e7eb |
| Mor (grafik) | #8b5cf6 · Pembe (grafik) #c0357a |

Modern yorum: daha yumuşak kart kenarları (rounded-xl), ince 1px border (white/5), hafif gradient/glow, hover'da kalkma, sayı animasyonları, iskelet yükleme, ikon seti lucide-react.

## 3. Ortak Bileşenler

- **KpiCard**: küçük gri etiket, büyük değer (+ küçük birim), sağ üstte ok + yüzde değişim (yeşil/kırmızı). Modül sayfalarında solda 3px renkli dikey şerit ve sol üstte ikon.
- **ToolCard / QuickLink**: ikon + kalın başlık + 1-2 satır açıklama, sağ panel "Hızlı Erişim / Araçlar ve Raporlar" listesi (3-4 adet).
- **DataTable**: başlık satırı küçük gri büyük harf, satırlar ince ayraçlı, sağda işlem ikonları.
- **StatusBadge**: pill: Çalışıyor (yeşil), Durdu (kırmızı), Bakımda (sarı), Aktif/Planlandı/Tamamlandı, Yüksek/Orta/Düşük, Kritik/Yeterli, Pasif.
- **ProgressBar**: ince, renkli, sağda yüzde.

## 4. Ekranlar (detay)

### 4.1 Ana Panel (Chatbot) – `/`
- Tam yükseklik sohbet. İlk bot mesajı (bot avatarı solda, saat sağ altta):
  "Merhaba! Ben Veri Analizi Asistanı. CSV verilerinize dair analiz yapmak, soru sormak veya grafikler oluşturmak için bana yazın. Örneğin:
  • "Departmanlara göre ortalama maaşları göster"
  • "Yaş dağılımı histogramını çiz"
  • "En yüksek maaşı alan 5 kişiyi listele""
- Altta input: placeholder "Veri Analizi Asistanına bir soru sorun veya grafik/analiz isteyin..." + mavi gönder butonu.
- Ek (modern): CSV/Excel yükleme butonu, cevaplarda tablo ve grafik render.

### 4.2 Genel Dashboard – `/dashboard` · Başlık: "Fabrika Performans Analizi"
- 4 KPI: Ortalama OEE **92.5%** (+2.3%, "Genel Ekipman Etkinliği", mavi) · Enerji Verimliliği **88%** (+4.5%, "Hedeflenen tüketimin altında", yeşil) · Kalite Oranı **99.2%** (+0.8%, "Hatasız üretim oranı", turuncu) · Planlı Duruş **2.3%** (-1.2%, "Bakım ve ayar süreleri", sarı)
- **Makine Performansı** (geniş kart): çizgi grafik "Üretim Hattı Performansı", 2 seri: Üretim Hattı 1 (mavi), Üretim Hattı 2 (turuncu), x: 08:00–15:00 saatlik, y: 0–100, değerler 82–95 arası.
- **Personel Performansı** (dar kart): donut "Personel Performans Metrikleri", dilimler: Verimlilik (mavi) · Kalite (turuncu) · İş Güvenliği (yeşil, 95) · Takım Çalışması (mor) · İnovasyon (pembe).
- **Üretim Öngörüleri**: Bu Hafta **12,500 Birim** · Gelecek Hafta **13,200 Birim** (mavi) · alt: "Trend: +5.6%" (yeşil) · "Güven Oranı: 92%".
- **Kritik Göstergeler**: progress listesi: Makine Kullanım Oranı 85% (mavi) · Enerji Tüketimi 72% (yeşil) · İş Güvenliği Skoru 95% (turuncu) · Kalite Kontrol 88% (sarı).

### 4.3 Finansal Yönetim Merkezi – `/finans`
- KPI: Toplam Gelir (YTD) **₺12.8M** (+15.2%) · Toplam Gider (YTD) **₺7.2M** (+8.5%) · Net Kâr Marjı **43.75%** (+2.1%) · Tahsil Edilecek Alacaklar **₺1.2M** (-5.0%)
- **Aylık Gelir-Gider Özeti** tablo (Kategori / Bu Ay / Geçen Ay / Değişim):
  Satış Gelirleri ₺2.1M ₺1.9M +10.5%↑ · Hammadde Maliyeti ₺850K ₺820K +3.6%↓ · İşletme Giderleri ₺450K ₺460K -2.2%↑ · Pazarlama Giderleri ₺150K ₺140K +7.1%↓ · Net Faaliyet Kârı ₺650K ₺480K +35.4%↑
- **Hızlı Erişim**: Detaylı Finans Raporları · Bütçe Takibi ve Planlama · Maliyet Analizi Araçları
- Ek (modern): 12 aylık gelir/gider alan grafiği.

### 4.4 Üretim ve Operasyonlar Merkezi – `/uretim`
- KPI: Ort. OEE Oranı **82.5%** (+1.5%) · Toplam Üretim (Bu Ay) **17,450 birim** (+5.2%) · Planlanmamış Duruş **18 saat** (-10%) · İlk Seferde Kalite Oranı **97.8%** (+0.3%)
- **Üretim Hatları Anlık Durum** (2x2 grid): Montaj Hattı 1 [Çalışıyor] OEE 88%, Plan/Gerçek 1200/1150 · Paketleme Hattı A [Durdu] OEE 75%, 800/600 · CNC İşleme Merkezi [Bakımda] OEE 92%, 500/480 · Montaj Hattı 2 [Çalışıyor] OEE 91%, 1500/1400. Her biri progress bar.
- **Raporlar ve Araçlar**: Detaylı OEE Analizi · Üretim Planlama Takvimi · Arıza ve Duruş Kayıtları · Kalite Kontrol Raporları

### 4.5 İnsan Kaynakları Yönetimi – `/insan-kaynaklari`
- KPI: Toplam Aktif Çalışan **485** (+12 yeni) · Personel Devir Oranı (Yıllık) **8.2%** (-1.5%) · Ort. Eğitim Saati (Kişi Başı) **24 saat** (+8%) · Ort. İşe Alım Süresi **28 gün** (-3 gün)
- **Departman Bazında Çalışan Dağılımı** (3x2 kart, sol mavi şerit): Üretim Departmanı 280 · Ar-Ge ve İnovasyon 45 · Satış ve Pazarlama 60 · Finans ve Muhasebe 35 · Lojistik ve Depo 40 · Yönetim ve İdari İşler 25
- **İK Sistemleri ve Araçlar**: Performans Değerlendirme · Eğitim ve Gelişim Portalı · İşe Alım ve Yetenek Yönetimi · Personel Arama ve Profil

### 4.6 Satış ve Pazarlama Merkezi – `/satis`
- KPI: Toplam Satış Hacmi (Bu Ay) **₺3.2M** (+12.5%) · Yeni Müşteri Sayısı **128** (+22) · Ort. Sipariş Değeri **₺1,850** (+4.8%) · Müşteri Kayıp Oranı **2.1%** (-0.5%)
- **Pazarlama Kampanyaları** tablo (Kampanya Adı / Platform / Bitiş Tarihi / Durum): Yaz Sezonu İndirimleri · Web Sitesi & Sosyal Medya · 31.08.2023 · Aktif | Yeni Ürün Lansmanı · E-posta & Influencer · 15.09.2023 · Planlandı | Stok Eritme Fırsatları · Pazaryerleri · 20.08.2023 · Tamamlandı
- **Satış Araçları ve Raporlar**: Detaylı Satış Analizleri · Müşteri Segmentasyonu · Kampanya Yönetimi · Pazar Araştırması ve Trendler

### 4.7 Envanter ve Tedarik Zinciri Yönetimi – `/envanter`
- KPI: Stok Devir Hızı **6.8 kez/yıl** (+0.5) · Envanter Doğruluğu **98.9%** (+0.2%) · Ort. Tedarik Süresi **12.5 gün** (-1 gün) · Taşıma Maliyeti (Birim Başı) **₺12.75** (-₺0.50)
- **Kritik Stok Seviyeleri** tablo (Ürün Adı / Stok / Min. Stok / Tedarikçi / Durum): MODEL-X Ana Kartı 25 / 20 / Elektronik A.Ş. / Kritik · A-PLUS Sensör Modülü 150 / 100 / Sensortek Ltd. / — · DELTA-9 Güç Ünitesi 80 / 50 / EnerjiMax A.Ş. / Yeterli · OMEGA Kasa Birimi 220 / 200 / MetalForm San. / Yeterli
- **Araçlar ve Raporlar**: Detaylı Envanter Analizi · Tedarikçi Performans Yönetimi · Talep Tahmini ve Planlama

### 4.8 Kalite Yönetim Sistemi – `/kalite`
- KPI: Müşteri Memnuniyet Oranı **96.5%** (+1.2%) · Dış Hata Oranı (PPM) **150 ppm** (-25) · İç Hata Maliyeti **₺85K** (-₺10K) · Tamamlanan Kalite Projeleri **18** (+3)
- **Kalite Kontrol Noktaları Performansı** tablo (Kontrol Noktası / Son Denetim / Uygunluk / Sorumlu): Hammadde Giriş Kontrolü 10.08.2023 99.5% A. Yılmaz · Üretim Hattı A – Ara Kontrol 11.08.2023 98.2% B. Kaya · Final Ürün Testi ve Sevkiyat Öncesi Kontrol 09.08.2023 99.8% C. Demir · Paketleme ve Etiketleme Doğruluğu 10.08.2023 100% D. Can
- **Kalite Araçları ve Raporlar**: Uygunsuzluk Yönetimi (CAPA) · Denetim ve Sertifikasyon · İstatistiksel Süreç Kontrolü (SPC)

### 4.9 Bakım Yönetimi Merkezi – `/bakim`
- KPI: Planlı Bakım Uyumu **92.7%** (+2.1%) · Ort. Tamir Süresi (MTTR) **4.2 saat** (-0.5) · Bu Ayki Arıza Sayısı **12** (-3) · Kestirimci Bakım İsabet Oranı **78.5%** (+5%)
- **Bekleyen Bakım İş Emirleri** tablo (Makine/Ekipman / Açıklama / Öncelik / Atanan / Plan. Tarih): CNC Torna #3 · Mil yatağı ses yapıyor, kontrol gerekli. · Yüksek · Bakım Ekibi A · 16.08.2023 | Pres Makinesi #1 · Hidrolik sistem periyodik bakımı. · Orta · M. Ali Usta · 18.08.2023 | Montaj Robotu #5 · Sensör kalibrasyonu yapılacak. · Düşük · Otomasyon Servisi · 22.08.2023
- **Bakım Araçları**: Yeni İş Emri Oluştur · Tüm İş Emirleri · Makine Bakım Geçmişi · Kestirimci Bakım Analizleri

### 4.10 Enerji ve Çevre Yönetimi – `/enerji`
- KPI: Toplam Enerji Tüketimi (Bu Ay) **250,000 kWh** (-5%) · Su Kullanımı (Bu Ay) **1,200 m³** (-2%) · Karbon Ayak İzi (Yıllık) **1,500 tCO2e** (-8%) · Atık Geri Dönüşüm Oranı **75%** (+10%)
- **Enerji Tüketim Dağılımı (Aylık)** progress listesi: Üretim Makineleri 65% (mavi) · Aydınlatma 15% (sarı) · HVAC Sistemleri 12% (yeşil) · Ofis Ekipmanları 5% (mor) · Diğer 3% (gri)
- **Araçlar ve Raporlar**: Detaylı Enerji Analizi · Çevre Uygunluk Raporları · Sürdürülebilirlik Projeleri · Risk ve Uyarı Yönetimi

### 4.11 Stratejik Analizler ve Öngörüler – `/stratejik`
- KPI: Pazar Payı Değişimi (Yıllık) **+2.5%** · Yeni Ürün Başarı Oranı **65%** (+10%) · Genel Risk Puanı **4.2/10** (-0.8) · Rekabet Yoğunluk Endeksi **Yüksek**
- **SWOT Analizi Özeti** (2x2):
  - Güçlü Yönler (yeşil): Güçlü marka bilinirliği · Yenilikçi ürün portföyü · Deneyimli yönetim ekibi · Yüksek üretim kapasitesi
  - Zayıf Yönler (kırmızı): Bazı pazarlarda sınırlı dağıtım ağı · Yüksek hammadde bağımlılığı · Dijital pazarlamada gelişme ihtiyacı
  - Fırsatlar (mavi): Yeni gelişen pazarlara açılma · E-ticaret kanalını güçlendirme · Sürdürülebilir üretim teknolojileri · Stratejik ortaklıklar
  - Tehditler (sarı): Artan rekabet baskısı · Hammadde fiyatlarındaki dalgalanmalar · Değişen tüketici tercihleri · Ekonomik belirsizlikler
- **Strateji Araçları**: Rekabet Analizi Detayları · Senaryo Planlama ve Simülasyon · Pazar Fırsatları ve Risk Değerlendirme

### 4.12 Detaylı Analiz – `/analiz` (videoda açılmadı; tutarlı şekilde tasarlanacak)
- Veri seti seçici (Üretim/Satış/Kalite/Enerji), tarih aralığı, gruplama; büyük grafik + özet istatistik tablosu + korelasyon ısı haritası.

### 4.13 Senaryo Analizi – `/senaryo` (videoda açılmadı)
- Slider'lar: Talep değişimi %, Hammadde fiyatı %, Vardiya sayısı, Enerji fiyatı %. Anında hesaplanan sonuç kartları (Üretim, Gelir, Maliyet, Kâr) ve baz vs senaryo karşılaştırma grafiği. 3 hazır senaryo: İyimser / Baz / Kötümser.

### 4.14 Harita Entegrasyonu – `/harita`
- Başlık sağında butonlar: Katmanlar · Yardım
- Sol kolon: **Filtreler** (Bölge / Lokasyon Tipi / Performans select'leri, "Tümü") + mavi "Filtreleri Uygula" butonu. **Özet Bilgiler**: Toplam Lokasyon **6** · Toplam Değer **16,100,000 ₺** (mavi) · Performans Dağılımı: Yüksek 2 (yeşil) · Orta 3 (mavi) · Düşük 1 (turuncu)
- Sağ: Leaflet harita (Türkiye), OpenStreetMap, 6 renkli daire marker.
- Alt: **Lokasyon Listesi** tablo (Lokasyon / Bölge / Tip / Performans / Değer / Trend): İstanbul Merkez Ofis · Marmara · Ofis · Yüksek · 4,250,000 ₺ · +12% | Ankara Şube · İç Anadolu · Şube · Orta · 2,750,000 ₺ · +5% | (tamamla: İzmir Fabrika · Ege · Fabrika · Yüksek · 5,100,000 · +8% | Bursa Üretim Tesisi · Marmara · Fabrika · Orta · 2,400,000 · +3% | Antalya Depo · Akdeniz · Depo · Düşük · 600,000 · -2% | Gaziantep Şube · Güneydoğu · Şube · Orta · 1,000,000 · +1%)

### 4.15 Kişisel Dashboard – `/kisisel`
- Sağ üst: "+ Widget Ekle" butonu → dropdown "Eklenebilir Widgetlar": Bölge Performansı · Departman Bazlı Performans · Stok Düzeyi · Hedef Gerçekleşme
- **Widget Yönetimi** tablo (Widget / Tip / Boyut / Durum(toggle) / İşlemler(göz, x)): Gelir Gider Grafiği · Grafik · Geniş · açık | Müşteri Dağılımı · Pasta · Dar · açık | Satış Tablosu · Tablo · Orta · açık
- **Dashboard Görünümü**: widget kartları (geniş tam satır, dar+orta yan yana), her kartta başlık + sağda ikonlar (taşı, gizle). Modern: gerçek grafik render, sürükle-bırak sıralama.

### 4.16 Tema Özelleştirme – `/tema`
- Sağ üst: "+ Yeni Tema Oluştur"
- Sol: **Hazır Temalar** (Koyu Tema · Aydın Tema · Mavi Tema, 3 renk noktası) · **Renk Şemaları** (Mavi · Yeşil · Mor · Kırmızı Tema)
- Sağ: **Renk Ayarları** 2 kolon: Ana Renk #0ea5e9 · İkincil Renk #38bdf8 · Vurgu Rengi #f97316 · Başarı #4ade80 · Uyarı #facc15 · Hata #ef4444 · Arka Plan #111827 · Kart Arka Planı #1f2937 · Metin Rengi #e5e7eb (her biri: ad, açıklama, renk kutusu + hex input, sağda daire önizleme)
- Alt: **Önizleme** kartı. Değişiklikler CSS değişkenlerine canlı uygulanır (localStorage).

### 4.17 Yetki Yönetimi – `/yetki`
- Sağ üst sekme: Kullanıcılar (aktif) · Roller. Arama "Kullanıcı ara..." · sağda "+ Kullanıcı Ekle"
- Tablo (Kullanıcı / E-posta / Rol / Durum / Son Giriş / İşlemler): Ahmet Yılmaz ahmet@ornek.com Admin(kırmızı) Aktif 2 saat önce · Ayşe Demir ayse@ornek.com Yönetici(mavi) Aktif 1 gün önce · Mehmet Kaya mehmet@ornek.com Analist(açık mavi) Aktif 3 saat önce · Zeynep Şahin zeynep@ornek.com Gözlemci(gri) Aktif 5 gün önce · Ali Yıldız ali@ornek.com Yönetici Pasif 30 gün önce
- Roller sekmesi: Admin / Yönetici / Analist / Gözlemci × modül izin matrisi (checkbox).

### 4.18 Rapor Oluşturma – `/rapor`
- Sağ üst sekme: Yeni Rapor (aktif) · Raporlarım
- Sol: **Rapor Bilgileri** (Rapor Adı*, Rapor Türü select "Özet Rapor", Açıklama textarea) · **Bileşen Ekle** grid: Başlık · Metin · Tablo · Grafik · Görsel
- Sağ: **Rapor İçeriği** + "Kaydet" ve "PDF İndir" butonları. Bileşen listesi (her biri ↑ ↓ 🗑): Rapor Başlığı "Aylık Satış Raporu – Mayıs 2023" · Giriş Metni "Bu rapor, Mayıs 2023 ayına ait satış verilerini içermektedir. Raporda bölge bazlı satış performansı, ürün kategorisi bazında satışlar ve geçen yıl verileri ile karşılaştırmalar yer almaktadır." · Satış Grafiği (select "Aylık Satışlar" + grafik önizleme) · Ürün Kategorisi Satışları (select + tablo: Kategori / Satış / Büyüme / Durum)
- PDF İndir → backend PDF üretir.

### 4.19 E-posta Gönderimi – `/eposta`
- Sağ üst sekme: Zamanlanmış E-postalar (aktif) · Yeni E-posta. Arama + "+ Yeni E-posta"
- Tablo (E-posta Başlığı / Alıcılar(chip) / Raporlar(chip) / Zamanlama / Son Gönderim / Durum / İşlemler ✓ ✎ 🗑):
  Haftalık Satış Raporu · Yönetim Ekibi, Satış Ekibi · Aylık Satış Raporu, Haftalık Performans Özeti · Her Pazartesi 09:00 · 24.04.2023 · Aktif
  Aylık Performans Değerlendirmesi · Yönetim Ekibi, Pazarlama Ekibi, İK Ekibi · Haftalık Performans Özeti, Finansal Özet · Her ayın 1. günü 10:00 · 01.05.2023 · Aktif
  Müşteri Analiz Raporu · Yönetim Ekibi, Satış Ekibi, Pazarlama Ekibi · Müşteri Analizi · Her ayın 15. günü 14:00 · 15.04.2023 · Pasif
- Yeni E-posta formu: alıcılar, konu, rapor seçimi, zamanlama; "Şimdi Gönder" → backend SMTP (env yoksa simüle, log'a yazar).

### 4.20 Veri Kaynakları – `/veri-kaynaklari`
- Sağ üst sekme: Tüm Kaynaklar (aktif) · Yeni Kaynak Ekle. Arama + "+ Yeni Kaynak"
- Tablo (Veri Kaynağı / Tür / Bağlantı / Kayıt Sayısı / Boyut / Son Güncelleme / Durum / İşlemler ⟳ ✕ 🗑):
  CRM Veritabanı · Veritabanı · mssql://user:****@crm-server/crm_db · 1,250,000+ · 4.5 GB · 2 saat önce · Bağlı
  Satış Verileri · Excel Dosyası · /data/satis_verileri_2023.xlsx · 45,800 · 12 MB · 1 gün önce · Bağlı
  Müşteri API · API / Web Servisi · https://api.example.com/customers · 350,000+ · N/A · 30 dk önce · Bağlı
  Ürün Kataloğu · Dosya Yükleme · /data/urun_katalogu.csv · 25,000 · 8 MB · 5 gün önce · Bağlantı Yok (kırmızı)
- Yeni Kaynak: tür seçimi (Veritabanı / Excel / CSV / API), gerçek CSV/Excel upload → backend parse eder, chatbot bu veriyi kullanır.

---

## 5. Backend API Sözleşmesi (FastAPI, port 8000, prefix `/api`)

Tüm cevaplar JSON. CORS: http://localhost:3005.

| Method | Path | Açıklama |
|---|---|---|
| GET | /api/health | `{status:"ok"}` |
| GET | /api/dashboard | `{kpis:[{key,label,value,unit,delta,deltaLabel,description,color}], machineSeries:[{time,"Üretim Hattı 1","Üretim Hattı 2"}], personnel:[{name,value,color}], forecast:{thisWeek,nextWeek,trend,confidence}, indicators:[{label,value,color}]}` |
| GET | /api/modules/{slug} | slug ∈ finans, uretim, insan-kaynaklari, satis, envanter, kalite, bakim, enerji, stratejik. Cevap: `{title, icon, kpis:[...], sections:[{type:"table"|"cards"|"progress"|"lines"|"swot"|"chart", title, ...}], tools:[{title,description,icon}]}` (bölüm 4'teki veriler birebir) |
| GET | /api/analytics/datasets | analiz için veri seti listesi |
| GET | /api/analytics/{dataset}?from&to&groupBy | zaman serisi + özet istatistik + korelasyon |
| POST | /api/scenario | body: `{demandChange, materialPriceChange, shifts, energyPriceChange}` → `{baseline:{...}, scenario:{...}, series:[...]}` |
| GET | /api/locations | harita lokasyonları `[{id,name,region,type,performance,value,trend,lat,lng}]` |
| GET/POST/PATCH/DELETE | /api/widgets | kişisel dashboard widget'ları (in-memory) |
| GET | /api/widgets/available | eklenebilir widget listesi |
| GET/PUT | /api/theme | tema renkleri |
| GET/POST/PATCH/DELETE | /api/users · GET /api/roles | yetki yönetimi |
| GET/POST/PUT/DELETE | /api/reports · POST /api/reports/{id}/pdf → application/pdf | rapor oluşturma |
| GET/POST/PATCH/DELETE | /api/emails · POST /api/emails/{id}/send | zamanlanmış e-postalar; send: SMTP env varsa gerçek, yoksa `{simulated:true}` |
| GET/POST/DELETE | /api/datasources · POST /api/datasources/upload (multipart) · POST /api/datasources/{id}/sync | veri kaynakları; upload CSV/XLSX parse eder, özet döner |
| POST | /api/chat | body: `{message, history:[{role,content}], datasourceId?}` → `{reply, table?:{columns,rows}, chart?:{type,data,xKey,yKeys}}`. OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL env varsa LLM (pandas kod üretip çalıştırır, güvenli sandbox), yoksa kural tabanlı yerel analiz (ortalama/grupla/histogram/top-N/describe). Varsayılan veri seti: `backend/data/hr_attrition.csv` (Demolarca'daki IBM HR CSV kopyalanacak) |

Env (`backend/.env.example`): OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL=gpt-4o, SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL.

## 6. Çalıştırma

- backend: `cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000`
- frontend: `cd frontend && npm run dev -- -p 3005` (3000 makinede dolu)
- kök: `./dev.sh` ikisini birden başlatır.

---

## 7. TASARIM YÖNÜ (KESİN – kullanıcı talebi)

**Tema: Lacivert + Bej. Cam işçiliği (glassmorphism). Dünya sınıfı, el yapımı hissi. Kesinlikle "yapay zeka üretimi" gibi görünmemeli.**

### Palet (videodaki mavi/gri palet YERİNE bunu kullan)
| Token | Hex | Kullanım |
|---|---|---|
| --navy-950 | #070e1c | sayfa arka planı en derin |
| --navy-900 | #0b1528 | sayfa arka planı (radyal gradient ile 950'ye akar) |
| --navy-800 | #10203a | sidebar / yüzey |
| --navy-700 | #172b4d | kart iç yüzey (cam altındaki ton) |
| --navy-600 | #21375e | hover yüzeyi, ayraçlar |
| --sand-50 | #f6f1e7 | ana metin (sıcak kırık beyaz) |
| --sand-100 | #ece3d1 | ikincil metin |
| --sand-200 | #d9cbae | başlık vurgusu, ikonlar |
| --sand-300 | #c4b28d | ana vurgu (accent) – butonlar, aktif menü, KPI değeri |
| --sand-400 | #a8956c | accent hover / koyu bej |
| --sand-500/bronze | #8b7a55 | ince çizgiler, kenar highlight |
| --muted | rgba(246,241,231,0.55) | etiketler |
| Durum: başarı #7fb28a · uyarı #d9b86a · hata #c96b6b · bilgi #7f9fcf | pastel/sessiz, doygun neon YOK |
| Grafik serileri (sırayla) | #c4b28d (bej) · #7f9fcf (çelik mavi) · #c8875a (bakır) · #8fa98a (adaçayı) · #b8707a (gül) · #9b8fbf (lavanta gri) |

### Cam işçiliği (glass)
- Kartlar: `background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`, `backdrop-filter: blur(18px) saturate(140%)`, `border: 1px solid rgba(196,178,141,0.14)`, üst kenarda 1px daha parlak highlight (`inset 0 1px 0 rgba(255,255,255,0.08)`), yumuşak gölge `0 20px 50px -20px rgba(0,0,0,0.6)`.
- Sayfa arka planında 2-3 büyük, çok yavaş hareket eden (60s) yumuşak bej/lacivert ışık lekesi (blur 120px, opacity 0.12) — cam üstünde derinlik hissi. `prefers-reduced-motion` ile durur.
- İnce grain/noise overlay (SVG feTurbulence, opacity 0.035) — dijital düzlüğü kırar.
- Aktif menü öğesi: bej camsı dolgu (rgba(196,178,141,0.14)) + solda 2px bej şerit + hafif iç glow. Neon mavi dolgu YOK.
- Butonlar: primary = bej (sand-300) zemin, lacivert metin, hover'da sand-200 + hafif kalkma. secondary = cam.

### Tipografi
- Başlıklar: **"Fraunces"** (Google Fonts, optical size, hafif serif) — ağırlık 500-600, letter-spacing -0.01em. Sayfa başlıkları 28-32px.
- Gövde/UI: **"Manrope"** — 14-15px, tabular-nums KPI ve tablolarda (`font-variant-numeric: tabular-nums`).
- Küçük etiketler: 11-12px, letter-spacing 0.08em, uppercase, sand-200 %60 opaklık.
- Inter/Roboto/Arial KULLANMA.

### "AI yapmış gibi durmasın" kuralları
- Emoji yok. Mor→pembe gradient yok. Her kart aynı boyutta simetrik grid YOK: dashboard'da bilinçli asimetri (örn. 7/5, 8/4 kolon oranları, bir kartın diğerinden farklı yüksekliği).
- Gerçek mikro-etkileşimler: KPI sayıları yüklenirken 600ms count-up; kart hover'da 1px yukarı + border parlaması; tablo satırı hover'da bej ince sol şerit; sekme geçişlerinde kısa fade+slide (150ms).
- İskelet yükleme (shimmer bej tonunda).
- Grafiklerde gridline'lar çok ince ve seyrek (rgba sand 0.08), tooltip cam kart, legend özel (küçük çizgi + metin), Recharts varsayılan stilleri ASLA kalmasın.
- Boşluk sistemi tutarlı: 4/8/12/16/24/32/48. Kart padding 24. Kart radius 20. Buton radius 12. Chip radius 999.
- İkonlar: lucide-react, stroke 1.5, boyut 18. Sidebar ikonları sand-200, aktifte sand-300.
- Sidebar üstünde logo: küçük, ince çizgili özel SVG monogram (V harfi + çubuk grafik motifi), yanında "VESPERA" Fraunces 500, 18px, letter-spacing 0.12em. Altında "Fabrika Zekâ Platformu" 11px muted.
- Footer: "© 2026 App On Inc." sessiz.
- Detaylara özen: tablo başlıklarında ince alt çizgi bej %12, sayılar sağa hizalı, ₺ sembolü ince ağırlık, tarih formatı `16 Ağu 2023`.
- Her sayfa başlığının altında 1 satır bej/muted alt başlık (sayfanın amacı) — videoda yok, modern dokunuş.
- Üst bar cam: blur, alt kenar 1px bej %10, sağda arama (⌘K hissi), bildirim, ayarlar, avatar (baş harfler, bej daire).

---

## 8. GENİŞLEME (v2 – kullanıcı talebi: "büyük firmalar için her şey", stok vb.)

Marka: tüm "App On Inc." ifadeleri **"App On Inc."** olur (footer: "© 2026 App On Inc."). Ürün adı VESPERA kalır.

### Yeni sidebar grupları ve modüller (hepsi generic ModulePage + backend /api/modules/{slug})
- **TEDARİK & LOJİSTİK**: `stok` Stok Yönetimi · `satin-alma` Satın Alma · `tedarikciler` Tedarikçi Yönetimi · `lojistik` Lojistik & Sevkiyat
- **MÜŞTERİ & İNSAN**: `musteriler` Müşteri Yönetimi (CRM) · `vardiya` Vardiya Planlama · `isg` İş Sağlığı & Güvenliği
- **VARLIK & ZEKÂ**: `varliklar` Varlık & Makine Yönetimi · `tahmin` AI Öngörü & Anomali · `hedefler` Hedef & KPI Takibi (OKR)
- **YÖNETİŞİM**: `uyarilar` Uyarı Merkezi · `denetim` Denetim Günlüğü · `belgeler` Belge Yönetimi · `entegrasyonlar` Entegrasyonlar (ERP/MES/IoT)

Her modül: 4 KPI + 2–3 bölüm (table/cards/progress/chart/lines) + 3–4 araç. İçerik gerçekçi Türkçe fabrika verisi (ürün kodları, depo adları, tedarikçi firmaları, sevkiyat numaraları, sensör ID'leri, ISO/IATF referansları).

### Yeni backend uçları
- `GET /api/modules` → tüm modüllerin `{slug,title,group,icon}` listesi
- `GET /api/notifications` · `POST /api/notifications/{id}/read` · `POST /api/notifications/read-all` → `[{id,title,body,level:"info"|"warn"|"err"|"ok",time,read,href}]`
- `GET /api/live` → her çağrıda değişen simüle sensör/hat anlık verisi `{ts, lines:[{name,oee,rate,temp,status}], plant:{energyKw,activeStaff,openAlerts}}`
- `GET /api/audit` → denetim günlüğü satırları
- CORS: statik hosting için `allow_origins=["*"]`

### Frontend eklemeleri
- **Splash screen**: ilk açılışta (session başına 1 kez) tam ekran lacivert, monogram çizim animasyonu + VESPERA wordmark + ince bej ilerleme çizgisi, ~1.6 s, fade-out; reduced-motion'da anında kapanır.
- **Bildirim merkezi**: zil → popover liste, okundu işaretle, seviye renkleri.
- **Canlı şerit**: dashboard üstünde 3 sn'de bir güncellenen "Canlı" göstergeler.
- **Dışa aktar**: her modül sayfasında ve tablolu ayar sayfalarında CSV indir.
- **Hata sınırı**: `error.tsx`, `not-found.tsx` Türkçe, cam kart, "Yeniden dene".
- **Statik export**: `output: "export"` → `out/` klasörü hosting'e yüklenebilir; `NEXT_PUBLIC_API_URL` build-time.
