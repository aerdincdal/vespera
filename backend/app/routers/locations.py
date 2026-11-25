from typing import Optional

from fastapi import APIRouter, Query

from app.data import seed

router = APIRouter(tags=["locations"])


@router.get("/locations")
def list_locations(
    region: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    performance: Optional[str] = Query(None),
):
    rows = seed.LOCATIONS
    if region and region.lower() not in ("tümü", "tumu", "all"):
        rows = [r for r in rows if r["region"] == region]
    if type and type.lower() not in ("tümü", "tumu", "all"):
        rows = [r for r in rows if r["type"] == type]
    if performance and performance.lower() not in ("tümü", "tumu", "all"):
        p = performance.lower()
        rows = [r for r in rows if r["performance"] == p or r["performanceLabel"].lower() == p]
    return rows


@router.get("/locations/summary")
def locations_summary():
    rows = seed.LOCATIONS
    dist = {"high": 0, "medium": 0, "low": 0}
    for r in rows:
        dist[r["performance"]] += 1
    return {
        "total": len(rows),
        "totalValue": sum(r["value"] for r in rows),
        "performance": dist,
        "regions": sorted({r["region"] for r in rows}),
        "types": sorted({r["type"] for r in rows}),
    }
