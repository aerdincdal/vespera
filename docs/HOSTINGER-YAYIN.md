# VESPERA · Hostinger'a Yayınlama

Frontend statik dosya olarak dışa aktarılır (`frontend/out/`). Varsayılan build **demo modundadır** (`NEXT_PUBLIC_API_URL` boş): backend gerekmez, 39 modülün tamamı, chatbot, tema, widget ve raporlar yerleşik demo verisiyle çalışır. Backend (FastAPI) istenirse ayrı bir sunucuya kurulur. Yalnızca dosya yükleme, PDF üretimi, gerçek e-posta ve yüklenen veri üzerinde sohbet backend ister.

## 1. Statik paketi üret

```bash
cd frontend
# Backend'in herkese açık adresi varsa build öncesi ayarla (yoksa demo verisiyle çalışır):
#   echo 'NEXT_PUBLIC_API_URL=https://api.senin-alanadin.com' > .env.production
npm run build          # out/ klasörünü üretir
npm run package        # vespera-static.zip
```

## 2. Hostinger'a yükle

1. hPanel → Web Sitesi → Dosya Yöneticisi → `public_html`
2. `public_html` içini boşalt, `vespera-static.zip`'i yükle ve **Extract** et (dosyalar doğrudan `public_html/` altına gelmeli: `index.html`, `dashboard/`, `_next/` ...)
3. `public_html/.htaccess` dosyası oluştur (klasör tabanlı yönlendirmeler ve 404 için):

```apache
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_headers.c>
  <FilesMatch "\.(js|css|woff2|svg|png|jpg)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
```

4. Alan adını aç → splash ekranı ve ardından Ana Panel görünmeli.

## 3. Backend (isteğe bağlı)

Backend'i bir VPS'e (Hostinger VPS / herhangi bir Linux) kur:

```bash
cd backend && python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # OPENAI_API_KEY, SMTP_* doldur
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Sonra frontend'i `NEXT_PUBLIC_API_URL=https://api.alanadin.com` ile yeniden build edip yükle. CORS her kaynağa açık.
