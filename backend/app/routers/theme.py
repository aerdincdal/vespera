from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.store import store

router = APIRouter(tags=["theme"])

_HEX_CHARS = set("0123456789abcdefABCDEF")


def _valid_hex(v: str) -> bool:
    return isinstance(v, str) and v.startswith("#") and len(v) in (4, 7) and all(c in _HEX_CHARS for c in v[1:])


class ThemeColor(BaseModel):
    key: str
    label: Optional[str] = None
    description: Optional[str] = None
    value: str


class ThemePut(BaseModel):
    activePreset: Optional[str] = None
    colors: Optional[list[ThemeColor]] = None
    presets: Optional[list[dict[str, Any]]] = None
    schemes: Optional[list[dict[str, Any]]] = None


def _with_flat(theme: dict) -> dict:
    flat = {c["key"]: c["value"] for c in theme["colors"]}
    flat["error"] = flat.get("danger", "")
    theme["flat"] = flat
    return theme


@router.get("/theme")
def get_theme():
    return _with_flat(store.get_theme())


@router.put("/theme")
def put_theme(body: ThemePut):
    current = store.get_theme()
    if body.activePreset is not None:
        current["activePreset"] = body.activePreset
    if body.colors is not None:
        by_key = {c["key"]: c for c in current["colors"]}
        for c in body.colors:
            if not _valid_hex(c.value):
                raise HTTPException(status_code=422, detail=f"Geçersiz renk değeri: {c.key}={c.value}")
            if c.key in by_key:
                by_key[c.key]["value"] = c.value
                if c.label:
                    by_key[c.key]["label"] = c.label
                if c.description:
                    by_key[c.key]["description"] = c.description
            else:
                current["colors"].append({"key": c.key, "label": c.label or c.key, "description": c.description or "", "value": c.value})
    if body.presets is not None:
        current["presets"] = body.presets
    if body.schemes is not None:
        current["schemes"] = body.schemes
    current.pop("flat", None)
    return _with_flat(store.set_theme(current))


@router.post("/theme/reset")
def reset_theme():
    return _with_flat(store.reset_theme())
