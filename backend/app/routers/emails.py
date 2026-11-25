from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.data import seed
from app.services import email_service, pdf_service
from app.store import store

router = APIRouter(tags=["emails"])


class EmailCreate(BaseModel):
    subject: str
    recipients: list[str] = []
    reportIds: list[str] = []
    schedule: str = "Her Pazartesi 09:00"
    status: str = "Aktif"
    body: Optional[str] = None


class EmailPatch(BaseModel):
    subject: Optional[str] = None
    recipients: Optional[list[str]] = None
    reportIds: Optional[list[str]] = None
    schedule: Optional[str] = None
    status: Optional[str] = None
    body: Optional[str] = None


class SendBody(BaseModel):
    to: Optional[list[str]] = None  # explicit addresses; default from recipient groups
    attachPdf: bool = False


def _report_names(report_ids: list[str]) -> list[str]:
    names = []
    for rid in report_ids:
        r = store.reports.get(rid)
        names.append(r["name"] if r else rid)
    return names


def _resolve_addresses(recipients: list[str]) -> list[str]:
    out = []
    for r in recipients:
        if "@" in r:
            out.append(r)
            continue
        grp = next((g for g in seed.RECIPIENT_GROUPS if g["name"] == r or g["id"] == r), None)
        out.append(grp["email"] if grp else f"{r.lower().replace(' ', '.')}@ornek.com")
    return out


@router.get("/emails")
def list_emails(q: Optional[str] = Query(None)):
    rows = store.emails.all()
    if q:
        ql = q.lower()
        rows = [e for e in rows if ql in e["subject"].lower() or any(ql in r.lower() for r in e["recipients"])]
    return rows


@router.get("/emails/options")
def email_options():
    return {
        "recipientGroups": seed.RECIPIENT_GROUPS,
        "reports": [{"id": r["id"], "name": r["name"]} for r in store.reports.all()],
        "schedules": ["Her gün 08:00", "Her Pazartesi 09:00", "Her Cuma 17:00", "Her ayın 1. günü 10:00", "Her ayın 15. günü 14:00"],
        "smtpConfigured": email_service.smtp_config() is not None,
    }


@router.post("/emails", status_code=201)
def create_email(body: EmailCreate):
    data = body.model_dump()
    data["reports"] = _report_names(body.reportIds)
    data["lastSent"] = "-"
    return store.emails.create(data)


@router.get("/emails/{email_id}")
def get_email(email_id: str):
    row = store.emails.get(email_id)
    if not row:
        raise HTTPException(status_code=404, detail="E-posta bulunamadı")
    return row


@router.patch("/emails/{email_id}")
def patch_email(email_id: str, body: EmailPatch):
    patch = body.model_dump(exclude_none=True)
    if "reportIds" in patch:
        patch["reports"] = _report_names(patch["reportIds"])
    row = store.emails.update(email_id, patch)
    if not row:
        raise HTTPException(status_code=404, detail="E-posta bulunamadı")
    return row


@router.delete("/emails/{email_id}", status_code=204)
def delete_email(email_id: str):
    if not store.emails.delete(email_id):
        raise HTTPException(status_code=404, detail="E-posta bulunamadı")
    return None


@router.post("/emails/{email_id}/send")
def send_email(email_id: str, body: Optional[SendBody] = None):
    email = store.emails.get(email_id)
    if not email:
        raise HTTPException(status_code=404, detail="E-posta bulunamadı")
    body = body or SendBody()
    reports = [r for r in (store.reports.get(rid) for rid in email.get("reportIds", [])) if r]
    to = body.to or _resolve_addresses(email.get("recipients", []))
    attachment = None
    if body.attachPdf and reports:
        attachment = pdf_service.render_report_pdf(reports[0])
    result = email_service.send_email(email, reports, to, attachment)
    if result.get("simulated") or result.get("sent"):
        store.emails.update(email_id, {"lastSent": datetime.now().strftime("%d.%m.%Y")})
    result["email"] = store.emails.get(email_id)
    return result
