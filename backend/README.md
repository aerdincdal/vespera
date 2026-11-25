# VESPERA Backend (FastAPI)

Simulated data service for VESPERA, the App On Inc. factory intelligence
platform. All data lives in memory (`app/data/seed.py`, `app/data/seed_v2.py`
`app/data/seed_v3.py` and `app/store.py`), so a restart resets it.

## Setup

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # optional: fill OPENAI_* / SMTP_* keys
```

## Run

```bash
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Docs: http://localhost:8000/docs · Health: http://localhost:8000/api/health

## Layout

```
app/
  main.py               FastAPI app, CORS (all origins, no credentials), router registration
  store.py              in-memory collections with CRUD helpers
  data/seed.py          the original 9 modules and every settings screen (SPEC §4)
  data/seed_v2.py       14 v2 modules, sidebar groups, notifications, audit log, live feed seed (SPEC §8)
  data/seed_v3.py       16 v3 modules (Üretim Zekâsı, Finans & Yatırım, Kurumsal)
  routers/              one file per API area (dashboard, modules, analytics, scenario,
                        locations, widgets, theme, users, reports, emails, datasources, chat,
                        notifications, live, audit)
  services/
    chat_service.py     LLM (OpenAI-compatible) + sandboxed pandas exec, or rule-based Turkish analyzer
    pdf_service.py      reportlab PDF rendering (TTF with Turkish glyphs when available)
    email_service.py    smtplib sending, simulated when SMTP_* is not set
    datasource_service.py  CSV/XLSX parsing with pandas, JSON-safe conversion
data/hr_attrition.csv   default chat dataset (IBM HR attrition, UTF-8 BOM)
```

## Endpoints (prefix `/api`)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{status:"ok"}` |
| GET | `/dashboard` | KPIs, machine series, personnel split, forecast, indicators |
| GET | `/modules` | all 39 modules: `[{slug,title,navTitle,group,icon,subtitle}]` in sidebar order |
| GET | `/modules/{slug}` | one module: `{title,subtitle,icon,group,kpis[],sections[],tools[]}` |
| GET | `/analytics/datasets` · `/analytics/{dataset}` | analysis time series, stats, correlation |
| POST | `/scenario` | what-if simulation |
| GET | `/locations` | map locations |
| GET/POST/PATCH/DELETE | `/widgets` · GET `/widgets/available` | personal dashboard widgets |
| GET/PUT | `/theme` | theme colours |
| GET/POST/PATCH/DELETE | `/users` · GET `/roles` | user and role management |
| GET/POST/PUT/DELETE | `/reports` · POST `/reports/{id}/pdf` | reports, PDF rendering |
| GET/POST/PATCH/DELETE | `/emails` · POST `/emails/{id}/send` | scheduled e-mails |
| GET/POST/DELETE | `/datasources` · POST `/datasources/upload` · POST `/datasources/{id}/sync` | data sources |
| POST | `/chat` | data chat (LLM or rule-based) |
| GET | `/notifications` | `{items:[{id,title,body,level,time,read,href}], unread}` |
| POST | `/notifications/{id}/read` · `/notifications/read-all` | mark as read |
| GET | `/live` | `{ts, lines:[{name,oee,rate,temp,status,statusLabel}], plant:{energyKw,activeStaff,openAlerts}}`, random walk per call |
| GET | `/audit?limit=&offset=&user=&result=` | `{items:[{id,time,user,action,target,ip,result}], total}` |

Module slugs: `finans uretim insan-kaynaklari satis envanter kalite bakim enerji stratejik`
(Fabrika Yönetimi) · `stok satin-alma tedarikciler lojistik` (Tedarik & Lojistik) ·
`musteriler vardiya isg` (Müşteri & İnsan) · `varliklar tahmin hedefler` (Varlık & Zekâ) ·
`uyarilar denetim belgeler entegrasyonlar` (Yönetişim) ·
`uretim-planlama receteler izlenebilirlik iot-sensorler dijital-ikiz kalibrasyon yedek-parca` (Üretim Zekâsı) ·
`maliyet butce projeler` (Finans & Yatırım) ·
`surdurulebilirlik risk-uyum tesisler arge egitim sikayetler` (Kurumsal).

Section types inside a module: `table` (`columns[{key,label,align}]`, `rows[]`, optional
`statusKey` / `progressKey`), `cards` (`items[{title,value,unit,status?,progress?,meta?}]`),
`progress` (`items[{label,value,color}]`), `lines` (production lines), `swot`, `chart`
(`chartType`, `data`, `xKey`, `yKeys`, `unit`).

## Chat engine (Veri Analizi Asistanı)

Every reply is Turkish. `POST /api/chat` returns `{reply, table?, chart?, code?, title?, engine: "llm"|"rules", model, datasourceId}`.

- **Default dataset**: `data/hr_attrition.csv` (IBM HR) is translated at start-up into
  `data/hr_personel_tr.csv` (Turkish column names such as "Aylık Gelir", "Departman",
  "Ayrılma" and Turkish category values such as "Satış", "Kadın", "Evet"). The exact file the
  chat analyses is served at `GET /api/datasources/default/csv`; `GET /api/chat/welcome`
  returns the column list and suggested questions.
- **LLM engine** (Groq or any OpenAI-compatible endpoint via `OPENAI_BASE_URL`):
  1. `OPENAI_MODEL` receives a compact Turkish schema and returns `{"title", "code"}` with
     `response_format: json_object`; if the endpoint rejects JSON mode the call is retried
     without it, short 429s are waited out, and any other failure moves to
     `OPENAI_MODEL_FALLBACK` (then to the rule engine).
  2. The code runs in a sandbox (`pd`, `np`, `df`, whitelisted builtins, 5 s timeout, no
     imports/IO). One repair round is offered on errors.
  3. A second, short call writes the Turkish explanation from the *executed* result, so the
     numbers in the prose match the table. If that call fails a deterministic Turkish summary
     is used instead.
- **Rule engine** (no key, or the LLM failed): Turkish synonyms and stemming map words to
  columns (maaş/gelir→Aylık Gelir, bölüm→Departman, kıdem→Şirkette Yıl, …), and it supports
  grouped mean/sum/median/max/min, counts and cross tabs, rates and percentages of yes/no
  columns, top/bottom N, histograms, correlation, describe, column listing and filters
  ("yaşı 40'tan büyük", "Satış departmanında", "ayrılanlar", "fazla mesai yapanlar").
  Numbers use Turkish formatting (6.959,17 · %16,1 · ₺6.959).

Upload a CSV/XLSX at `POST /api/datasources/upload` and pass the returned `id` as
`datasourceId` to `POST /api/chat` to analyse that file instead of the default dataset.
