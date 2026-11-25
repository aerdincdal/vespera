"""Parsing uploaded CSV/XLSX files with pandas and summarising DataFrames."""

from __future__ import annotations

import io
import math
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
SOURCE_CSV = DATA_DIR / "hr_attrition.csv"          # original IBM HR dataset (English)
DEFAULT_CSV = DATA_DIR / "hr_personel_tr.csv"       # Turkish translation served to users
DEFAULT_NAME = "hr_personel_tr.csv"

_default_df: pd.DataFrame | None = None


def default_dataframe() -> pd.DataFrame:
    """The Turkish default dataset (built from hr_attrition.csv on first use)."""
    global _default_df
    if _default_df is None:
        from app.services.hr_translate import build_turkish_dataset

        _default_df = build_turkish_dataset(SOURCE_CSV, DEFAULT_CSV)
    return _default_df


def parse_upload(filename: str, content: bytes) -> pd.DataFrame:
    name = (filename or "").lower()
    if name.endswith((".xlsx", ".xlsm", ".xls")):
        return pd.read_excel(io.BytesIO(content))
    # CSV: try utf-8-sig then latin-1, sniff separator
    for enc in ("utf-8-sig", "utf-8", "cp1254", "latin-1"):
        try:
            text = content.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError("Dosya kodlaması okunamadı")
    sep = ","
    head = text[:5000]
    if head.count(";") > head.count(","):
        sep = ";"
    elif head.count("\t") > head.count(","):
        sep = "\t"
    return pd.read_csv(io.StringIO(text), sep=sep)


def interval_label(iv: "pd.Interval") -> str:
    """Human-friendly bin label: integer ranges when the interval covers whole
    numbers ("18–22"), otherwise one-decimal edges ("0,5–1,2")."""
    if iv.closed_right:
        lo = math.floor(iv.left) + 1 if float(iv.left).is_integer() else math.ceil(iv.left)
        hi = math.floor(iv.right)
    else:
        lo = math.ceil(iv.left)
        hi = math.ceil(iv.right) - 1 if float(iv.right).is_integer() else math.floor(iv.right)
    if lo <= hi and (iv.right - iv.left) >= 1:
        return f"{lo}–{hi}"
    fmt = lambda x: f"{round(float(x), 1):g}".replace(".", ",")  # noqa: E731
    return f"{fmt(iv.left)}–{fmt(iv.right)}"


def to_jsonable(value: Any) -> Any:
    """Convert numpy/pandas scalars & NaN to plain JSON-safe Python values."""
    if value is None:
        return None
    if isinstance(value, pd.Interval):
        return interval_label(value)
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return None
        return round(f, 4)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()
    if isinstance(value, (pd.Timedelta,)):
        return str(value)
    if isinstance(value, (np.ndarray, list, tuple)):
        return [to_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {str(k): to_jsonable(v) for k, v in value.items()}
    if hasattr(value, "item"):
        try:
            return to_jsonable(value.item())
        except Exception:
            pass
    if isinstance(value, (int, str, bool)):
        return value
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return str(value)


def frame_rows(df: pd.DataFrame, limit: int | None = None) -> list[dict]:
    if limit is not None:
        df = df.head(limit)
    df = df.reset_index() if not isinstance(df.index, pd.RangeIndex) else df
    cols = [str(c) for c in df.columns]
    out = []
    for rec in df.itertuples(index=False, name=None):
        out.append({c: to_jsonable(v) for c, v in zip(cols, rec)})
    return out


def frame_columns(df: pd.DataFrame) -> list[dict]:
    cols = []
    for c in df.columns:
        dtype = str(df[c].dtype)
        kind = "number" if pd.api.types.is_numeric_dtype(df[c]) else ("date" if pd.api.types.is_datetime64_any_dtype(df[c]) else "string")
        cols.append({"key": str(c), "label": str(c), "dtype": dtype, "kind": kind, "nulls": int(df[c].isna().sum())})
    return cols


def describe_frame(df: pd.DataFrame, name: str, size_bytes: int, type_label: str) -> dict:
    return {
        "name": name,
        "type": type_label,
        "rows": int(len(df)),
        "columnCount": int(df.shape[1]),
        "columns": frame_columns(df),
        "preview": frame_rows(df, 5),
        "sizeBytes": int(size_bytes),
    }


def human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"
