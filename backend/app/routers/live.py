"""Live plant feed: a seeded random walk kept in process memory so values
drift smoothly between calls instead of jumping."""

from __future__ import annotations

import copy
import random
import threading
from datetime import datetime, timezone

from fastapi import APIRouter

from app.data import seed

router = APIRouter(tags=["live"])

_lock = threading.RLock()
_rng = random.Random(2026)
_state = copy.deepcopy(seed.LIVE_INITIAL)

_STATUS_LABEL = {"running": "Çalışıyor", "stopped": "Durdu", "maintenance": "Bakımda"}


def _walk(value: float, step: float, lo: float, hi: float, digits: int = 1) -> float:
    value += _rng.uniform(-step, step)
    return round(min(hi, max(lo, value)), digits)


def _tick() -> dict:
    for line in _state["lines"]:
        status = line["status"]
        if status == "running":
            line["oee"] = _walk(line["oee"], 0.6, 70.0, 98.0)
            line["rate"] = int(_walk(line["rate"], 12, 300, 1800, 0))
            line["temp"] = _walk(line["temp"], 0.4, 30.0, 70.0)
            if _rng.random() < 0.02:
                line["status"] = "stopped"
        elif status == "stopped":
            line["oee"] = _walk(line["oee"], 0.3, 55.0, 90.0)
            line["rate"] = max(0, int(_walk(line["rate"] * 0.7, 8, 0, 1800, 0)))
            line["temp"] = _walk(line["temp"] - 0.2, 0.3, 25.0, 70.0)
            if _rng.random() < 0.15:
                line["status"] = "running"
        else:  # maintenance
            line["rate"] = 0 if _rng.random() < 0.5 else int(_walk(line["rate"], 20, 0, 600, 0))
            line["temp"] = _walk(line["temp"], 0.3, 30.0, 70.0)
            if _rng.random() < 0.05:
                line["status"] = "running"

    plant = _state["plant"]
    plant["energyKw"] = _walk(plant["energyKw"], 18.0, 900.0, 1650.0)
    if _rng.random() < 0.3:
        plant["activeStaff"] = int(min(220, max(120, plant["activeStaff"] + _rng.choice((-2, -1, 1, 2)))))
    if _rng.random() < 0.25:
        plant["openAlerts"] = int(min(40, max(5, plant["openAlerts"] + _rng.choice((-1, 1)))))

    snapshot = copy.deepcopy(_state)
    for line in snapshot["lines"]:
        line["statusLabel"] = _STATUS_LABEL[line["status"]]
    snapshot["ts"] = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    return snapshot


@router.get("/live")
def live():
    with _lock:
        snap = _tick()
    return {"ts": snap["ts"], "lines": snap["lines"], "plant": snap["plant"]}
