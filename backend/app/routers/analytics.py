from __future__ import annotations

import math
import random
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.data import seed

router = APIRouter(tags=["analytics"])

_ANCHOR_END = date(2026, 9, 20)  # fixed so responses are deterministic
_RANGE_DAYS = 90


def _parse_date(value: Optional[str], fallback: date) -> date:
    if not value:
        return fallback
    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(value[:19], fmt).date()
        except ValueError:
            continue
    raise HTTPException(status_code=422, detail=f"Geçersiz tarih: {value}")


def _generate_daily(dataset: str) -> tuple[list[date], dict[str, list[float]]]:
    """Deterministic 90-day series for every metric of a dataset."""
    profiles = seed.ANALYTICS_PROFILES[dataset]
    start = _ANCHOR_END - timedelta(days=_RANGE_DAYS - 1)
    days = [start + timedelta(days=i) for i in range(_RANGE_DAYS)]
    series: dict[str, list[float]] = {}
    for mi, (metric, (base, noise, trend, weekend)) in enumerate(profiles.items()):
        rng = random.Random(f"{dataset}:{metric}")
        values = []
        for i, d in enumerate(days):
            seasonal = 1 + 0.04 * math.sin(2 * math.pi * i / 30 + mi)
            v = (base + trend * i) * seasonal + rng.gauss(0, noise)
            if d.weekday() >= 5:
                v *= weekend
            v = max(v, 0.0)
            values.append(round(v, 2))
        series[metric] = values
    return days, series


def _bucket_key(d: date, group_by: str) -> str:
    if group_by == "week":
        iso = d.isocalendar()
        return f"{iso[0]}-W{iso[1]:02d}"
    if group_by == "month":
        return d.strftime("%Y-%m")
    return d.isoformat()


def _std(values: list[float]) -> float:
    n = len(values)
    if n < 2:
        return 0.0
    mean = sum(values) / n
    return math.sqrt(sum((v - mean) ** 2 for v in values) / (n - 1))


def _pearson(a: list[float], b: list[float]) -> float:
    n = len(a)
    if n < 2:
        return 0.0
    ma, mb = sum(a) / n, sum(b) / n
    cov = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    va = math.sqrt(sum((x - ma) ** 2 for x in a))
    vb = math.sqrt(sum((y - mb) ** 2 for y in b))
    if va == 0 or vb == 0:
        return 0.0
    return round(cov / (va * vb), 3)


@router.get("/analytics/datasets")
def list_datasets():
    return [dict(d, label=d["name"]) for d in seed.ANALYTICS_DATASETS]


@router.get("/analytics/{dataset}")
def get_analytics(
    dataset: str,
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None),
    groupBy: str = Query("day", pattern="^(day|week|month)$"),
):
    if dataset not in seed.ANALYTICS_PROFILES:
        raise HTTPException(status_code=404, detail=f"Veri seti bulunamadı: {dataset}")

    days, series = _generate_daily(dataset)
    start = _parse_date(from_, days[0])
    end = _parse_date(to, days[-1])
    if start > end:
        start, end = end, start

    idx = [i for i, d in enumerate(days) if start <= d <= end]
    if not idx:
        raise HTTPException(status_code=422, detail="Seçilen aralıkta veri yok (kapsanan aralık: %s – %s)" % (days[0], days[-1]))

    metrics = list(series.keys())
    filtered = {m: [series[m][i] for i in idx] for m in metrics}
    fdays = [days[i] for i in idx]

    # group
    buckets: dict[str, dict[str, list[float]]] = {}
    order: list[str] = []
    for j, d in enumerate(fdays):
        key = _bucket_key(d, groupBy)
        if key not in buckets:
            buckets[key] = {m: [] for m in metrics}
            order.append(key)
        for m in metrics:
            buckets[key][m].append(filtered[m][j])

    sum_metrics = {"Üretim Adedi", "Ciro (₺K)", "Sipariş Sayısı", "Yeni Müşteri", "İade Adedi", "Enerji (kWh)", "Su (m³)", "Karbon (kg)", "Duruş (saat)"}
    out_series = []
    for key in order:
        row = {"date": key, "label": key}
        for m in metrics:
            vals = buckets[key][m]
            agg = sum(vals) if (m in sum_metrics and groupBy != "day") else sum(vals) / len(vals)
            row[m] = round(agg, 2)
        out_series.append(row)

    stats = []
    for m in metrics:
        vals = filtered[m]
        half = max(len(vals) // 2, 1)
        first, second = vals[:half], vals[half:] or vals[:half]
        trend_pct = ((sum(second) / len(second)) / (sum(first) / len(first)) - 1) * 100 if sum(first) else 0.0
        stats.append({
            "metric": m,
            "trend": f"{trend_pct:+.1f}%",
            "mean": round(sum(vals) / len(vals), 2),
            "min": round(min(vals), 2),
            "max": round(max(vals), 2),
            "std": round(_std(vals), 2),
        })

    matrix = [[_pearson(filtered[a], filtered[b]) if a != b else 1.0 for b in metrics] for a in metrics]
    meta = next(d for d in seed.ANALYTICS_DATASETS if d["id"] == dataset)

    return {
        "dataset": meta,
        "from": fdays[0].isoformat(),
        "to": fdays[-1].isoformat(),
        "groupBy": groupBy,
        "metrics": metrics,
        "series": out_series,
        "stats": stats,
        "correlation": {"labels": metrics, "matrix": matrix},
    }
