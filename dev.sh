#!/usr/bin/env bash
# VESPERA – backend (8000) ve frontend (3005) birlikte başlatır. Ctrl+C ikisini de kapatır.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() { echo; echo "Kapatılıyor..."; kill 0 2>/dev/null || true; }
trap cleanup INT TERM EXIT

echo "▸ Backend  → http://localhost:8000  (docs: /docs)"
( cd "$ROOT/backend" && exec .venv/bin/uvicorn app.main:app --reload --port 8000 ) &

echo "▸ Frontend → http://localhost:3005"
( cd "$ROOT/frontend" && exec npm run dev ) &

wait
