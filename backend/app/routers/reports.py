from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from app.data import seed
from app.services import pdf_service
from app.store import store

router = APIRouter(tags=["reports"])


class ReportComponent(BaseModel):
    id: Optional[str] = None
    type: str  # title | text | chart | table | image
    label: Optional[str] = None
    content: Optional[str] = None
    source: Optional[str] = None
    chartType: Optional[str] = None
    data: Optional[list[dict[str, Any]]] = None
    xKey: Optional[str] = None
    yKeys: Optional[list[str]] = None
    columns: Optional[list[dict[str, Any]]] = None
    rows: Optional[list[dict[str, Any]]] = None


class ReportBody(BaseModel):
    name: str
    type: str = "Özet Rapor"
    reportType: Optional[str] = None  # alias for type
    description: Optional[str] = ""
    components: list[ReportComponent] = []


def _normalise(body: ReportBody) -> dict:
    data = body.model_dump(exclude_none=True)
    if data.get("reportType"):
        data["type"] = data.pop("reportType")
    comps = []
    for i, c in enumerate(data.get("components", []), start=1):
        c.setdefault("id", f"c{i}")
        comps.append(c)
    data["components"] = comps
    return data


def _safe_filename(name: str) -> str:
    ascii_name = name.translate(str.maketrans("çÇğĞıİöÖşŞüÜ", "cCgGiIoOsSuU"))
    ascii_name = "".join(ch if ch.isalnum() or ch in "-_ " else "_" for ch in ascii_name).strip().replace(" ", "_")
    return ascii_name or "rapor"


def _alias(r: dict) -> dict:
    r["reportType"] = r.get("type")
    return r


@router.get("/reports")
def list_reports():
    return [_alias(r) for r in store.reports.all()]


@router.get("/reports/options")
def report_options():
    return {
        "types": seed.REPORT_TYPES,
        "charts": seed.REPORT_CHART_OPTIONS,
        "tables": seed.REPORT_TABLE_OPTIONS,
        "chartData": seed.REPORT_CHART_DATA,
        "tableData": seed.REPORT_TABLE_DATA,
        "componentTypes": [
            {"type": "title", "label": "Başlık", "icon": "heading"},
            {"type": "text", "label": "Metin", "icon": "text"},
            {"type": "table", "label": "Tablo", "icon": "table"},
            {"type": "chart", "label": "Grafik", "icon": "bar-chart-3"},
            {"type": "image", "label": "Görsel", "icon": "image"},
        ],
        "pdfFont": pdf_service.font_info(),
    }


@router.post("/reports", status_code=201)
def create_report(body: ReportBody):
    now = datetime.now().isoformat(timespec="seconds")
    data = _normalise(body)
    data["createdAt"] = now
    data["updatedAt"] = now
    return store.reports.create(data)


@router.get("/reports/{report_id}")
def get_report(report_id: str):
    row = store.reports.get(report_id)
    if not row:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    return row


@router.put("/reports/{report_id}")
def update_report(report_id: str, body: ReportBody):
    existing = store.reports.get(report_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    data = _normalise(body)
    data["createdAt"] = existing.get("createdAt")
    data["updatedAt"] = datetime.now().isoformat(timespec="seconds")
    return store.reports.replace(report_id, data)


@router.delete("/reports/{report_id}", status_code=204)
def delete_report(report_id: str):
    if not store.reports.delete(report_id):
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    return None


@router.post("/reports/{report_id}/pdf")
def report_pdf(report_id: str, body: Optional[ReportBody] = None):
    """Render the stored report (or the unsaved body passed in) to PDF."""
    if body is not None:
        report = _normalise(body)
        report["id"] = report_id
    else:
        report = store.reports.get(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    pdf = pdf_service.render_report_pdf(report)
    fname = _safe_filename(report.get("name", "rapor")) + ".pdf"
    utf8_name = quote((report.get("name", "rapor") + ".pdf"))
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{fname}\"; filename*=UTF-8''{utf8_name}"},
    )


@router.post("/reports/preview/pdf")
def preview_pdf(body: ReportBody):
    report = _normalise(body)
    report["id"] = "preview"
    pdf = pdf_service.render_report_pdf(report)
    fname = _safe_filename(report.get("name", "rapor")) + ".pdf"
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=\"{fname}\""})
