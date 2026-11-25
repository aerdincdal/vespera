from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load backend/.env if present (before routers read env vars)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.routers import (  # noqa: E402
    analytics,
    audit,
    chat,
    dashboard,
    datasources,
    emails,
    live,
    locations,
    modules,
    notifications,
    reports,
    scenario,
    theme,
    users,
    widgets,
)

app = FastAPI(
    title="VESPERA API",
    description="Fabrika Zekâ Platformu – simüle veri servisi (App On Inc.)",
    version="2.0.0",
)

# The frontend is exported statically and may be hosted anywhere, so every
# origin is allowed. Credentials stay off: the API is cookie-free.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


for router in (
    dashboard.router,
    modules.router,
    analytics.router,
    scenario.router,
    locations.router,
    widgets.router,
    theme.router,
    users.router,
    reports.router,
    emails.router,
    datasources.router,
    chat.router,
    notifications.router,
    live.router,
    audit.router,
):
    app.include_router(router, prefix="/api")
