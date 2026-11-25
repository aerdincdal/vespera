from typing import Optional

from fastapi import APIRouter, Query

from app.data import seed

router = APIRouter(tags=["audit"])


@router.get("/audit")
def list_audit(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
):
    rows = seed.AUDIT_LOG
    if user:
        rows = [r for r in rows if user.lower() in r["user"].lower()]
    if result:
        rows = [r for r in rows if r["result"].lower() == result.lower()]
    total = len(rows)
    return {"items": rows[offset : offset + limit], "total": total, "limit": limit, "offset": offset}
