from fastapi import APIRouter

from app.data import seed

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard():
    return seed.DASHBOARD
