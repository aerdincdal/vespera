from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data import seed
from app.store import store

router = APIRouter(tags=["widgets"])

_TYPE_LABELS = {"chart": "Grafik", "pie": "Pasta", "table": "Tablo", "gauge": "Gösterge"}
_SIZE_LABELS = {"wide": "Geniş", "medium": "Orta", "narrow": "Dar"}


class WidgetCreate(BaseModel):
    title: str = ""
    typeKey: str = "chart"
    sizeKey: str = "medium"
    enabled: bool = True
    sourceId: Optional[str] = None  # id from /widgets/available
    # aliases accepted from the frontend
    key: Optional[str] = None
    type: Optional[str] = None
    size: Optional[str] = None


class WidgetPatch(BaseModel):
    title: Optional[str] = None
    typeKey: Optional[str] = None
    sizeKey: Optional[str] = None
    enabled: Optional[bool] = None
    order: Optional[int] = None


class WidgetReorder(BaseModel):
    ids: list[str]


def _decorate(row: dict) -> dict:
    row["type"] = _TYPE_LABELS.get(row.get("typeKey", ""), row.get("type", "Grafik"))
    row["size"] = _SIZE_LABELS.get(row.get("sizeKey", ""), row.get("size", "Orta"))
    row["typeLabel"] = row["type"]
    row["sizeLabel"] = row["size"]
    return row


@router.get("/widgets")
def list_widgets():
    return sorted((_decorate(w) for w in store.widgets.all()), key=lambda w: w.get("order", 0))


@router.get("/widgets/available")
def available_widgets():
    existing = {w["title"] for w in store.widgets.all()}
    return [dict(w, key=w["id"], added=w["title"] in existing) for w in seed.AVAILABLE_WIDGETS]


@router.post("/widgets", status_code=201)
def create_widget(body: WidgetCreate):
    data = body.model_dump()
    if body.type in _TYPE_LABELS:
        data["typeKey"] = body.type
    if body.size in _SIZE_LABELS:
        data["sizeKey"] = body.size
    source_id = body.sourceId or body.key
    if source_id:
        src = next((a for a in seed.AVAILABLE_WIDGETS if a["id"] == source_id or a["title"] == source_id), None)
        if src:
            data.update({"title": src["title"], "typeKey": src["typeKey"], "sizeKey": src["sizeKey"]})
    if not data.get("title"):
        raise HTTPException(status_code=422, detail="title veya key zorunlu")
    for k in ("sourceId", "key", "type", "size"):
        data.pop(k, None)
    data["order"] = len(store.widgets.all()) + 1
    return store.widgets.create(_decorate(data))


@router.patch("/widgets/{widget_id}")
def patch_widget(widget_id: str, body: WidgetPatch):
    patch = body.model_dump(exclude_none=True)
    if "typeKey" in patch:
        patch["type"] = _TYPE_LABELS.get(patch["typeKey"], "Grafik")
    if "sizeKey" in patch:
        patch["size"] = _SIZE_LABELS.get(patch["sizeKey"], "Orta")
    row = store.widgets.update(widget_id, patch)
    if not row:
        raise HTTPException(status_code=404, detail="Widget bulunamadı")
    return _decorate(row)


@router.put("/widgets/reorder")
def reorder_widgets(body: WidgetReorder):
    for i, wid in enumerate(body.ids, start=1):
        store.widgets.update(wid, {"order": i})
    return list_widgets()


@router.delete("/widgets/{widget_id}", status_code=204)
def delete_widget(widget_id: str):
    if not store.widgets.delete(widget_id):
        raise HTTPException(status_code=404, detail="Widget bulunamadı")
    return None
