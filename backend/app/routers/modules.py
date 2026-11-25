from fastapi import APIRouter, HTTPException

from app.data import seed

router = APIRouter(tags=["modules"])


@router.get("/modules")
def list_modules():
    """All modules (existing 9 + v2 14) in sidebar order with their group."""
    return [
        {
            "slug": m["slug"],
            "title": m["title"],
            "navTitle": m["navTitle"],
            "group": m["group"],
            "icon": m["icon"],
            "subtitle": m["subtitle"],
        }
        for m in seed.MODULES.values()
    ]


@router.get("/modules/{slug}")
def get_module(slug: str):
    module = seed.MODULES.get(slug)
    if not module:
        raise HTTPException(status_code=404, detail=f"Modül bulunamadı: {slug}")
    return module
