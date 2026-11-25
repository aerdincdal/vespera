"""Notification centre: in-memory list seeded from seed_v2.NOTIFICATIONS."""

from __future__ import annotations

import copy
import threading

from fastapi import APIRouter, HTTPException

from app.data import seed

router = APIRouter(tags=["notifications"])

_lock = threading.RLock()
_items: list[dict] = copy.deepcopy(seed.NOTIFICATIONS)


def _sorted() -> list[dict]:
    return sorted((copy.deepcopy(n) for n in _items), key=lambda n: n["time"], reverse=True)


@router.get("/notifications")
def list_notifications():
    with _lock:
        items = _sorted()
    return {"items": items, "unread": sum(1 for n in items if not n["read"])}


@router.post("/notifications/read-all")
def read_all():
    with _lock:
        for n in _items:
            n["read"] = True
        return {"ok": True, "unread": 0, "items": _sorted()}


@router.post("/notifications/{item_id}/read")
def read_one(item_id: str):
    with _lock:
        for n in _items:
            if n["id"] == item_id:
                n["read"] = True
                return {"ok": True, "item": copy.deepcopy(n), "unread": sum(1 for x in _items if not x["read"])}
    raise HTTPException(status_code=404, detail=f"Bildirim bulunamadı: {item_id}")
