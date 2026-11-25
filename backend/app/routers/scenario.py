from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.data import seed

router = APIRouter(tags=["scenario"])

_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
_SEASON = [0.92, 0.95, 1.00, 1.02, 1.05, 1.04, 0.98, 1.00, 1.06, 1.08, 1.03, 0.87]


class ScenarioInput(BaseModel):
    demandChange: float = Field(0, ge=-50, le=100, description="Talep değişimi %")
    materialPriceChange: float = Field(0, ge=-50, le=100, description="Hammadde fiyatı değişimi %")
    shifts: int = Field(2, ge=1, le=3, description="Vardiya sayısı")
    energyPriceChange: float = Field(0, ge=-50, le=100, description="Enerji fiyatı değişimi %")


def _compute(p: ScenarioInput) -> dict:
    b = seed.SCENARIO_BASE
    # capacity scales with shifts; demand scales with demandChange; production is min of the two
    capacity = b["units"] * (p.shifts / b["shifts"]) * 1.05
    demand = b["units"] * (1 + p.demandChange / 100)
    units = min(demand, capacity)
    # a shortage of capacity costs some price power; excess demand lets us hold price
    price = b["unitPrice"] * (1 + 0.15 * (p.demandChange / 100))
    revenue = units * price
    material = units * b["materialCostPerUnit"] * (1 + p.materialPriceChange / 100)
    energy = units * b["energyCostPerUnit"] * (1 + p.energyPriceChange / 100)
    labor = b["laborCostPerShift"] * p.shifts
    cost = material + energy + labor + b["fixedCost"]
    profit = revenue - cost
    return {
        "units": round(units),
        "production": round(units),
        "capacity": round(capacity),
        "demand": round(demand),
        "revenue": round(revenue),
        "cost": round(cost),
        "profit": round(profit),
        "margin": round(profit / revenue * 100, 1) if revenue else 0.0,
        "costBreakdown": {
            "material": round(material),
            "energy": round(energy),
            "labor": round(labor),
            "fixed": round(b["fixedCost"]),
        },
    }


def _delta(base: float, new: float) -> dict:
    diff = new - base
    pct = (diff / base * 100) if base else 0.0
    return {"absolute": round(diff), "percent": round(pct, 1)}


@router.get("/scenario/presets")
def presets():
    return seed.SCENARIO_PRESETS


@router.get("/scenario/baseline")
def baseline():
    return _compute(ScenarioInput())


@router.post("/scenario")
def run_scenario(body: ScenarioInput):
    base = _compute(ScenarioInput())
    scen = _compute(body)
    series = []
    for i, m in enumerate(_MONTHS):
        s = _SEASON[i]
        series.append({
            "month": m,
            "baseline": round(base["revenue"] * s),
            "scenario": round(scen["revenue"] * s),
            "Baz Gelir": round(base["revenue"] * s),
            "Senaryo Gelir": round(scen["revenue"] * s),
            "Baz Kâr": round(base["profit"] * s),
            "Senaryo Kâr": round(scen["profit"] * s),
        })
    return {
        "params": body.model_dump(),
        "baseline": base,
        "scenario": scen,
        "delta": {k: _delta(base[k], scen[k]) for k in ("units", "revenue", "cost", "profit")},
        "series": series,
        "xKey": "month",
        "yKeys": ["Baz Gelir", "Senaryo Gelir"],
    }
