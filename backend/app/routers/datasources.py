from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.data import seed
from app.services import datasource_service as dss
from app.store import store

router = APIRouter(tags=["datasources"])

MAX_UPLOAD = 50 * 1024 * 1024  # 50 MB
_TYPE_LABEL = {t["key"]: t["label"] for t in seed.DATASOURCE_TYPES}


class DatasourceCreate(BaseModel):
    name: str
    typeKey: str = "database"
    connection: str = ""
    status: Optional[str] = None


def _alias(d: dict) -> dict:
    d["recordCount"] = d.get("rows")
    d["updatedAt"] = d.get("lastUpdated")
    return d


@router.get("/datasources")
def list_datasources(q: Optional[str] = Query(None)):
    rows = [_alias(d) for d in store.datasources.all()]
    if q:
        ql = q.lower()
        rows = [d for d in rows if ql in d["name"].lower() or ql in d["type"].lower() or ql in d["connection"].lower()]
    return rows


@router.get("/datasources/types")
def datasource_types():
    return seed.DATASOURCE_TYPES


@router.get("/datasources/default/preview")
def default_preview():
    df = dss.default_dataframe()
    size = dss.DEFAULT_CSV.stat().st_size if dss.DEFAULT_CSV.exists() else 0
    info = dss.describe_frame(df, dss.DEFAULT_NAME, size, "CSV Dosyası")
    info["id"] = "default"
    return info


@router.get("/datasources/default/csv")
def default_csv():
    """The exact Turkish dataset the chat analyses, as a downloadable CSV (UTF-8 BOM)."""
    dss.default_dataframe()  # ensures the file is (re)built
    if not dss.DEFAULT_CSV.exists():
        raise HTTPException(status_code=404, detail="Varsayılan veri seti dosyası bulunamadı")
    return FileResponse(dss.DEFAULT_CSV, media_type="text/csv; charset=utf-8", filename=dss.DEFAULT_NAME)


@router.post("/datasources", status_code=201)
def create_datasource(body: DatasourceCreate):
    if body.typeKey not in _TYPE_LABEL:
        raise HTTPException(status_code=422, detail=f"Geçersiz tür: {body.typeKey}")
    row = {
        "name": body.name,
        "type": _TYPE_LABEL[body.typeKey],
        "typeKey": body.typeKey,
        "connection": body.connection,
        "rows": "—",
        "size": "N/A",
        "lastUpdated": "az önce",
        "status": body.status or "Bağlı",
        "connected": (body.status or "Bağlı") == "Bağlı",
        "uploaded": False,
    }
    return store.datasources.create(row)


@router.post("/datasources/upload", status_code=201)
async def upload_datasource(file: UploadFile = File(...), name: Optional[str] = Form(None)):
    filename = file.filename or "upload"
    lower = filename.lower()
    if not lower.endswith((".csv", ".xlsx", ".xls", ".xlsm", ".txt", ".tsv")):
        raise HTTPException(status_code=415, detail="Yalnızca CSV veya Excel (xlsx) dosyaları desteklenir")
    content = await file.read()
    if len(content) > MAX_UPLOAD:
        raise HTTPException(status_code=413, detail="Dosya 50 MB sınırını aşıyor")
    if not content:
        raise HTTPException(status_code=422, detail="Dosya boş")
    try:
        df = dss.parse_upload(filename, content)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Dosya ayrıştırılamadı: {exc}") from exc
    if df.empty or df.shape[1] == 0:
        raise HTTPException(status_code=422, detail="Dosyada veri bulunamadı")

    is_excel = lower.endswith((".xlsx", ".xls", ".xlsm"))
    type_label = "Excel Dosyası" if is_excel else "CSV Dosyası"
    display_name = name or filename
    summary = dss.describe_frame(df, display_name, len(content), type_label)

    row = store.datasources.create({
        "name": display_name,
        "type": type_label,
        "typeKey": "excel" if is_excel else "csv",
        "connection": f"/uploads/{filename}",
        "rows": f"{len(df):,}",
        "rowCount": int(len(df)),
        "size": dss.human_size(len(content)),
        "sizeBytes": len(content),
        "lastUpdated": "az önce",
        "uploadedAt": datetime.now().isoformat(timespec="seconds"),
        "status": "Bağlı",
        "connected": True,
        "uploaded": True,
        "columns": [c["key"] for c in summary["columns"]],
    })
    store.dataframes[row["id"]] = df
    summary["id"] = row["id"]
    summary["datasource"] = row
    return summary


@router.get("/datasources/{ds_id}")
def get_datasource(ds_id: str):
    row = store.datasources.get(ds_id)
    if not row:
        raise HTTPException(status_code=404, detail="Veri kaynağı bulunamadı")
    return row


@router.get("/datasources/{ds_id}/preview")
def preview_datasource(ds_id: str, limit: int = Query(5, ge=1, le=200)):
    df = store.dataframes.get(ds_id)
    row = store.datasources.get(ds_id)
    if df is None:
        if not row:
            raise HTTPException(status_code=404, detail="Veri kaynağı bulunamadı")
        raise HTTPException(status_code=409, detail="Bu kaynak için yüklenmiş veri yok (yalnızca yüklenen dosyalar önizlenebilir)")
    info = dss.describe_frame(df, row["name"] if row else ds_id, row.get("sizeBytes", 0) if row else 0, row["type"] if row else "CSV Dosyası")
    info["preview"] = dss.frame_rows(df, limit)
    info["id"] = ds_id
    return info


@router.post("/datasources/{ds_id}/sync")
def sync_datasource(ds_id: str):
    row = store.datasources.get(ds_id)
    if not row:
        raise HTTPException(status_code=404, detail="Veri kaynağı bulunamadı")
    updated = store.datasources.update(ds_id, {"lastUpdated": "az önce", "status": "Bağlı", "connected": True, "syncedAt": datetime.now().isoformat(timespec="seconds")})
    return {"synced": True, "message": f"{row['name']} senkronize edildi", "datasource": updated}


@router.delete("/datasources/{ds_id}", status_code=204)
def delete_datasource(ds_id: str):
    if not store.datasources.delete(ds_id):
        raise HTTPException(status_code=404, detail="Veri kaynağı bulunamadı")
    store.dataframes.pop(ds_id, None)
    return None
