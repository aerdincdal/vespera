"""Veri Analizi Asistanı.

Two engines, both answering in Turkish:

* **llm** – an OpenAI-compatible endpoint (Groq in production) generates
  ``{"explanation", "code"}``; the code runs in a sandboxed pandas namespace.
  The primary model is tried first, then ``OPENAI_MODEL_FALLBACK``; every
  failure falls through to the rule engine.
* **rules** – a Turkish intent/column matcher that handles grouping,
  filters, top-N, histograms, cross tabs, rates, correlation and summaries.
"""

from __future__ import annotations

import difflib
import json
import logging
import os
import re
import threading
import time
import unicodedata
from typing import Any, Optional

import numpy as np
import pandas as pd

from app.services.datasource_service import frame_columns, frame_rows, to_jsonable
from app.services.hr_translate import MONEY_COLUMNS

log = logging.getLogger("vespera.chat")

MAX_ROWS = 50
EXEC_TIMEOUT = 5.0
LLM_MAX_TOKENS = 2000

# ---------------------------------------------------------------------------
# Text normalisation
# ---------------------------------------------------------------------------
_TR_MAP = str.maketrans("çğıöşüâîûÇĞİÖŞÜÂÎÛ", "cgiosuaiuCGIOSUAIU")


def fold(text: str) -> str:
    """Lower-case, strip Turkish diacritics and apostrophes."""
    text = str(text).translate(_TR_MAP)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return text.lower().replace("'", " ").replace("’", " ").replace("‘", " ")


_SUFFIXES = sorted({
    "lardaki", "lerdeki", "daki", "deki", "taki", "teki",
    "larindan", "lerinden", "larinin", "lerinin", "larina", "lerine", "larini", "lerini",
    "lardan", "lerden", "larda", "lerde", "larin", "lerin", "lara", "lere", "lari", "leri", "lar", "ler",
    "indan", "inden", "undan", "unden", "ndan", "nden", "nin", "nun",
    "dan", "den", "tan", "ten", "da", "de", "ta", "te", "ya", "ye", "na", "ne",
    "si", "su", "ni", "nu", "yi", "yu", "in", "un", "im", "um", "i", "u", "a", "e", "m", "n",
}, key=len, reverse=True)

_SUFFIX_RE = re.compile("(" + "|".join(_SUFFIXES) + ")$")


def _stems(word: str) -> list[str]:
    """Candidate stems of a Turkish word: the word itself, then every form
    obtained by stripping one or two suffixes (longer stems first)."""
    word = fold(word).strip()
    out: list[str] = [word]
    frontier = [word]
    for _ in range(2):
        nxt: list[str] = []
        for cur in frontier:
            for suf in _SUFFIXES:
                if cur.endswith(suf) and len(cur) - len(suf) >= 3:
                    stripped = cur[: -len(suf)]
                    if stripped not in out:
                        out.append(stripped)
                        nxt.append(stripped)
        frontier = nxt
    # keep insertion order but prefer longer (less aggressive) stems
    return sorted(dict.fromkeys(out), key=len, reverse=True)


# Turkish (and English) synonyms → candidate column names, in priority order.
SYNONYMS: dict[str, list[str]] = {
    "maas": ["Aylık Gelir", "MonthlyIncome"],
    "gelir": ["Aylık Gelir", "MonthlyIncome"],
    "ucret": ["Aylık Gelir", "Saatlik Ücret", "MonthlyIncome", "HourlyRate"],
    "kazanc": ["Aylık Gelir", "MonthlyIncome"],
    "aylik gelir": ["Aylık Gelir", "MonthlyIncome"],
    "aylik ucret": ["Aylık Ücret", "MonthlyRate"],
    "gunluk ucret": ["Günlük Ücret", "DailyRate"],
    "saatlik ucret": ["Saatlik Ücret", "HourlyRate"],
    "yas": ["Yaş", "Age"],
    "departman": ["Departman", "Department"],
    "bolum": ["Departman", "Department"],
    "birim": ["Departman", "Department"],
    "cinsiyet": ["Cinsiyet", "Gender"],
    "pozisyon": ["Pozisyon", "JobRole"],
    "rol": ["Pozisyon", "JobRole"],
    "unvan": ["Pozisyon", "JobRole"],
    "gorev": ["Pozisyon", "JobRole"],
    "meslek": ["Pozisyon", "JobRole"],
    "egitim": ["Eğitim Seviyesi", "Eğitim Alanı", "Education", "EducationField"],
    "egitim alani": ["Eğitim Alanı", "EducationField"],
    "egitim seviyesi": ["Eğitim Seviyesi", "Education"],
    "egitim duzeyi": ["Eğitim Seviyesi", "Education"],
    "egitim sayisi": ["Geçen Yıl Eğitim Sayısı", "TrainingTimesLastYear"],
    "mesafe": ["Eve Uzaklık (km)", "DistanceFromHome"],
    "uzaklik": ["Eve Uzaklık (km)", "DistanceFromHome"],
    "eve uzaklik": ["Eve Uzaklık (km)", "DistanceFromHome"],
    "memnuniyet": ["İş Memnuniyeti", "JobSatisfaction"],
    "is memnuniyeti": ["İş Memnuniyeti", "JobSatisfaction"],
    "ortam memnuniyeti": ["Ortam Memnuniyeti", "EnvironmentSatisfaction"],
    "cevre memnuniyeti": ["Ortam Memnuniyeti", "EnvironmentSatisfaction"],
    "iliski memnuniyeti": ["İlişki Memnuniyeti", "RelationshipSatisfaction"],
    "ayrilma": ["Ayrılma", "Attrition"],
    "ayrilan": ["Ayrılma", "Attrition"],
    "ayrildi": ["Ayrılma", "Attrition"],
    "attrition": ["Ayrılma", "Attrition"],
    "isten ayrilma": ["Ayrılma", "Attrition"],
    "isten cikan": ["Ayrılma", "Attrition"],
    "isten cikma": ["Ayrılma", "Attrition"],
    "devir": ["Ayrılma", "Attrition"],
    "turnover": ["Ayrılma", "Attrition"],
    "medeni": ["Medeni Durum", "MaritalStatus"],
    "medeni durum": ["Medeni Durum", "MaritalStatus"],
    "medeni hal": ["Medeni Durum", "MaritalStatus"],
    "fazla mesai": ["Fazla Mesai", "OverTime"],
    "mesai": ["Fazla Mesai", "OverTime"],
    "seyahat": ["İş Seyahati", "BusinessTravel"],
    "is seyahati": ["İş Seyahati", "BusinessTravel"],
    "kidem": ["Şirkette Yıl", "YearsAtCompany"],
    "sirkette yil": ["Şirkette Yıl", "YearsAtCompany"],
    "sirkette gecen yil": ["Şirkette Yıl", "YearsAtCompany"],
    "sirketteki yil": ["Şirkette Yıl", "YearsAtCompany"],
    "deneyim": ["Toplam Deneyim (yıl)", "TotalWorkingYears"],
    "tecrube": ["Toplam Deneyim (yıl)", "TotalWorkingYears"],
    "toplam deneyim": ["Toplam Deneyim (yıl)", "TotalWorkingYears"],
    "toplam calisma yili": ["Toplam Deneyim (yıl)", "TotalWorkingYears"],
    "calisma yili": ["Toplam Deneyim (yıl)", "TotalWorkingYears"],
    "pozisyonda yil": ["Pozisyonda Yıl", "YearsInCurrentRole"],
    "terfi": ["Son Terfiden Bu Yana (yıl)", "YearsSinceLastPromotion"],
    "son terfi": ["Son Terfiden Bu Yana (yıl)", "YearsSinceLastPromotion"],
    "performans": ["Performans Puanı", "PerformanceRating"],
    "performans puani": ["Performans Puanı", "PerformanceRating"],
    "kademe": ["Kademe", "JobLevel"],
    "seviye": ["Kademe", "JobLevel"],
    "is seviyesi": ["Kademe", "JobLevel"],
    "zam": ["Zam Oranı (%)", "PercentSalaryHike"],
    "zam orani": ["Zam Oranı (%)", "PercentSalaryHike"],
    "maas artisi": ["Zam Oranı (%)", "PercentSalaryHike"],
    "hisse": ["Hisse Opsiyonu", "StockOptionLevel"],
    "hisse opsiyonu": ["Hisse Opsiyonu", "StockOptionLevel"],
    "is yasam dengesi": ["İş-Yaşam Dengesi", "WorkLifeBalance"],
    "is-yasam dengesi": ["İş-Yaşam Dengesi", "WorkLifeBalance"],
    "denge": ["İş-Yaşam Dengesi", "WorkLifeBalance"],
    "sirket sayisi": ["Çalışılan Şirket Sayısı", "NumCompaniesWorked"],
    "calisilan sirket": ["Çalışılan Şirket Sayısı", "NumCompaniesWorked"],
    "yoneticiyle yil": ["Mevcut Yöneticiyle Yıl", "YearsWithCurrManager"],
    "yonetici ile yil": ["Mevcut Yöneticiyle Yıl", "YearsWithCurrManager"],
    "baglilik": ["İşe Bağlılık", "JobInvolvement"],
    "ise baglilik": ["İşe Bağlılık", "JobInvolvement"],
    "katilim": ["İşe Bağlılık", "JobInvolvement"],
    "personel no": ["Personel No", "EmployeeNumber"],
    "sicil": ["Personel No", "EmployeeNumber"],
}

_STOPWORDS = {
    "gore", "ile", "icin", "olan", "olanlar", "olanlarin", "bir", "the", "and", "ve", "veya", "kac", "kisi", "kisiyi",
    "kisinin", "kisiler", "kisileri", "listele", "goster", "gosterir", "ver", "getir", "ciz", "cizdir", "olustur", "yap",
    "hesapla", "bul", "nedir", "neler", "nelerdir", "kadar", "en", "yuksek", "dusuk", "fazla", "az", "cok", "ortalama",
    "ortalamasi", "ortalamalari", "ortalamalarini", "toplam", "toplami", "sayi", "sayisi", "sayilari", "adet", "dagilim",
    "dagilimi", "dagilimini", "histogram", "histogrami", "histogramini", "grafik", "grafigi", "grafigini", "tablo",
    "tablosu", "ozet", "ozetle", "describe", "sutun", "sutunlar", "sutunlari", "kolon", "kolonlar", "alan", "alanlar",
    "alanlari", "veri", "verideki", "veriler", "verileri", "veride", "veriyi", "bazinda", "bazli", "grupla",
    "gruplayarak", "karsilastir", "medyan", "minimum", "maksimum", "min", "max", "std", "sapma", "standart", "oran",
    "orani", "oranlari", "yuzde", "yuzdesi", "yuzdeleri", "kacinci", "hangi", "nasil", "ne", "mi", "mu", "misin",
    "lutfen", "bana", "calisan", "calisanlar", "calisanlari", "calisanlarin", "calisanin", "personel", "personelin",
    "personellerin", "maasi", "arasinda", "arasindaki", "iliski", "iliskisi", "korelasyon", "korelasyonu", "buyuk",
    "kucuk", "ustu", "uzeri", "alti", "altinda", "uzerinde", "yukari", "asagi", "ilk", "son", "top", "liste", "listesi",
    "kayit", "kayitlar", "satir", "satirlar", "olsun", "olarak", "gibi", "daha", "var", "yok", "mevcut", "seti",
    "setinde", "setindeki", "setini", "dosya", "dosyada", "kimler", "kim", "neye", "neyle", "seklinde",
}

# Words that start a numeric comparison filter
_GT_WORDS = {"buyuk", "fazla", "yukari", "ustu", "uzeri", "uzerinde", "ustunde", "asan", "asiyor", "cok"}
_LT_WORDS = {"kucuk", "az", "altinda", "alti", "dusuk", "asagi", "altindaki"}
_EQ_WORDS = {"olan", "olanlar", "olanlarin", "olanlari", "esit"}
_GE_MARK = {"ve uzeri", "ve ustu", "veya daha fazla", "ve daha fazla"}
_LE_MARK = {"ve alti", "ve altinda", "veya daha az", "ve daha az"}

# categorical values too generic to act as a filter on their own
_GENERIC_VALUES = {"yok", "diger", "evet", "hayir", "other", "yes", "no", "none", "var", "tip"}

_ID_COLS = {"Personel No", "EmployeeNumber", "EmployeeCount", "StandardHours"}


# ---------------------------------------------------------------------------
# Number formatting (Turkish)
# ---------------------------------------------------------------------------
def _tr_int(v: float) -> str:
    return f"{int(round(v)):,}".replace(",", ".")


def _tr_float(v: float, digits: int = 2) -> str:
    s = f"{v:,.{digits}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def is_money(col: Optional[str]) -> bool:
    if not col:
        return False
    name = str(col)
    return name in MONEY_COLUMNS or any(m in name for m in MONEY_COLUMNS if len(m) > 6)


def fmt_num(v: Any, col: Optional[str] = None, digits: int = 2) -> str:
    v = to_jsonable(v)
    if v is None:
        return "—"
    if isinstance(v, bool):
        return "Evet" if v else "Hayır"
    if isinstance(v, (int, float)):
        if is_money(col):
            return "₺" + (_tr_int(v) if abs(v) >= 100 else _tr_float(v, 2))
        if isinstance(v, int) or float(v).is_integer():
            return _tr_int(v)
        return _tr_float(float(v), digits)
    return str(v)


def fmt_pct(v: float, digits: int = 1) -> str:
    return "%" + _tr_float(float(v), digits)


def _join_tr(items: list[str]) -> str:
    items = [str(i) for i in items]
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + " ve " + items[-1]


# ---------------------------------------------------------------------------
# Column matching
# ---------------------------------------------------------------------------
class ColumnMatcher:
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.columns = [str(c) for c in df.columns]
        self.folded = {fold(c): c for c in self.columns}
        # words of each column: camelCase split + non-alphanumerics → spaces
        self.words = {}
        for c in self.columns:
            w = re.sub(r"(?<!^)(?=[A-Z])", " ", c)
            w = re.sub(r"[^a-z0-9]+", " ", fold(w)).strip()
            self.words[c] = w

    def numeric(self) -> list[str]:
        return [c for c in self.columns if pd.api.types.is_numeric_dtype(self.df[c])]

    def metrics(self) -> list[str]:
        return [c for c in self.numeric() if c not in _ID_COLS]

    def categorical(self, max_unique: int = 30) -> list[str]:
        out = []
        for c in self.columns:
            s = self.df[c]
            if c in _ID_COLS:
                continue
            if not pd.api.types.is_numeric_dtype(s) and s.nunique() <= max_unique:
                out.append(c)
            elif pd.api.types.is_numeric_dtype(s) and s.nunique() <= 6:
                out.append(c)
        return out

    def text_categorical(self, max_unique: int = 30) -> list[str]:
        return [c for c in self.categorical(max_unique) if not pd.api.types.is_numeric_dtype(self.df[c])]

    def _resolve_synonym(self, key: str) -> Optional[str]:
        for cand in SYNONYMS.get(key, []):
            if cand in self.columns:
                return cand
        return None

    def match_phrase(self, phrase: str) -> Optional[str]:
        f = re.sub(r"\s+", " ", fold(phrase)).strip()
        if not f or f in _STOPWORDS:
            return None
        if f in self.folded:
            return self.folded[f]
        col = self._resolve_synonym(f)
        if col:
            return col
        words = f.split()
        head = " ".join(words[:-1])
        for stem in _stems(words[-1]):
            cand = f"{head} {stem}".strip()
            if cand in _STOPWORDS:
                continue
            col = self._resolve_synonym(cand)
            if col:
                return col
            if cand in self.folded:
                return self.folded[cand]
            for c, w in self.words.items():
                if len(cand) >= 4 and re.search(rf"(?<![a-z0-9]){re.escape(cand)}", w):
                    return c
        close = difflib.get_close_matches(f, list(SYNONYMS.keys()), n=1, cutoff=0.86)
        if close:
            col = self._resolve_synonym(close[0])
            if col:
                return col
        close = difflib.get_close_matches(f, list(self.folded.keys()), n=1, cutoff=0.86)
        if close:
            return self.folded[close[0]]
        return None

    def find_all(self, text: str) -> list[str]:
        """Every column referenced in free text, ordered by position."""
        found: list[tuple[int, str]] = []
        f = fold(text)
        # exact folded column names & multi-word synonyms first (longest first)
        phrases = sorted(set(list(self.folded.keys()) + [k for k in SYNONYMS if " " in k]), key=len, reverse=True)
        for key in phrases:
            if len(key) < 4:
                continue
            m = re.search(rf"(?<![a-z0-9]){re.escape(key)}", f)
            if not m:
                continue
            col = self.folded.get(key) or self._resolve_synonym(key)
            if col and col not in [c for _, c in found]:
                found.append((m.start(), col))
                f = f[: m.start()] + " " * (m.end() - m.start()) + f[m.end():]
        for m in re.finditer(r"[a-z0-9_\-]+", f):
            tok = m.group(0)
            if len(tok) < 3 or tok in _STOPWORDS or tok.isdigit():
                continue
            col = self.match_phrase(tok)
            if col and col not in [c for _, c in found]:
                found.append((m.start(), col))
        found.sort()
        return [c for _, c in found]


# ---------------------------------------------------------------------------
# Result → payload
# ---------------------------------------------------------------------------
def _col_format(col: str) -> Optional[str]:
    if is_money(col):
        return "currency"
    if "(%)" in str(col) or str(col).endswith("%") or "Oran" in str(col) or "Yüzde" in str(col):
        return "percent"
    return None


def series_to_table(s: pd.Series, name_label: str = "Kategori", value_label: str = "Değer") -> dict:
    s = s.head(MAX_ROWS)
    idx_name = str(s.index.name or name_label)
    val_name = str(s.name or value_label)
    if idx_name == val_name:
        val_name = value_label
    rows = [{idx_name: to_jsonable(k), val_name: to_jsonable(v)} for k, v in s.items()]
    return {
        "columns": [
            {"key": idx_name, "label": idx_name},
            {"key": val_name, "label": val_name, "align": "right", "format": _col_format(val_name)},
        ],
        "rows": rows,
    }


def _normalise_index(df: pd.DataFrame) -> pd.DataFrame:
    """Named / categorical indexes become a column; anonymous integer row
    labels (from nlargest, sort_values, …) are dropped."""
    if isinstance(df.index, pd.MultiIndex) or df.index.name or not pd.api.types.is_integer_dtype(df.index):
        return df.reset_index()
    return df.reset_index(drop=True)


def frame_to_table(df: pd.DataFrame) -> dict:
    df = _normalise_index(df.head(MAX_ROWS).copy())
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [" ".join(str(x) for x in col if str(x)).strip() for col in df.columns]
    cols = [str(c) for c in df.columns]
    df.columns = cols
    columns = []
    for c in cols:
        num = pd.api.types.is_numeric_dtype(df[c])
        columns.append({"key": c, "label": c, "align": "right" if num else None, "format": _col_format(c) if num else None})
    return {"columns": columns, "rows": frame_rows(df)}


def series_to_chart(s: pd.Series, chart_type: str = "bar", title: Optional[str] = None) -> dict:
    s = s.head(MAX_ROWS)
    data = [{"name": str(to_jsonable(k)), "value": to_jsonable(v)} for k, v in s.items()]
    return {
        "type": chart_type,
        "title": title or str(s.name or ""),
        "data": data,
        "xKey": "name",
        "yKeys": ["value"],
        "valueLabel": str(s.name or "Değer"),
        "format": _col_format(str(s.name or "")),
    }


def frame_to_chart(df: pd.DataFrame, chart_type: str, x: Optional[str], y: Any, title: Optional[str] = None) -> Optional[dict]:
    if df is None or df.empty:
        return None
    df = _normalise_index(df.head(MAX_ROWS).copy())
    df.columns = [str(c) for c in df.columns]
    if not x or x not in df.columns:
        non_num = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
        x = non_num[0] if non_num else df.columns[0]
    if isinstance(y, str):
        y_keys = [y]
    elif isinstance(y, (list, tuple)):
        y_keys = [str(k) for k in y]
    else:
        y_keys = [c for c in df.columns if c != x and pd.api.types.is_numeric_dtype(df[c])][:6]
    y_keys = [k for k in y_keys if k in df.columns]
    if not y_keys:
        return None
    return {"type": chart_type, "title": title or "", "data": frame_rows(df[[x] + y_keys]), "xKey": x, "yKeys": y_keys}


def result_to_payload(result: Any, chart_spec: Optional[dict], explanation: str, title: Optional[str] = None) -> dict:
    payload: dict[str, Any] = {"reply": explanation}
    chart_type = (chart_spec or {}).get("type") or "bar"
    title = (chart_spec or {}).get("title") or title
    if isinstance(result, (pd.Index, np.ndarray)):
        result = list(result)
    if isinstance(result, (list, tuple)) and result and all(not isinstance(v, (dict, list, tuple)) for v in result):
        result = pd.Series(list(result), name="Değer")
        result.index = range(1, len(result) + 1)
        result.index.name = "Sıra"
    if isinstance(result, pd.DataFrame):
        if result.shape == (1, 1):
            return result_to_payload(result.iloc[0, 0], None, explanation, title)
        payload["table"] = frame_to_table(result)
        if chart_spec:
            ch = frame_to_chart(result, chart_type, chart_spec.get("x"), chart_spec.get("y"), title)
            if ch:
                payload["chart"] = ch
    elif isinstance(result, pd.Series):
        if len(result) == 1 and not isinstance(result.index, pd.MultiIndex) and result.index[0] in (0, result.name):
            return result_to_payload(result.iloc[0], None, explanation, title)
        payload["table"] = series_to_table(result)
        if pd.api.types.is_numeric_dtype(result) and (chart_spec or len(result) <= 30) and str(result.index.name) != "Sıra":
            payload["chart"] = series_to_chart(result, chart_type, title)
    elif isinstance(result, dict):
        s = pd.Series(result)
        payload["table"] = series_to_table(s, "Anahtar", "Değer")
    elif isinstance(result, (list, tuple, np.ndarray)):
        try:
            payload["table"] = frame_to_table(pd.DataFrame(list(result)))
        except Exception:
            payload["reply"] = f"{explanation}\n\nSonuç: {', '.join(str(to_jsonable(v)) for v in list(result)[:20])}"
    elif result is not None:
        value = fmt_num(result)
        if value not in explanation:
            payload["reply"] = f"{explanation}\n\nSonuç: {value}" if explanation else f"Sonuç: {value}"
        payload["table"] = {
            "columns": [{"key": "Gösterge", "label": "Gösterge"}, {"key": "Değer", "label": "Değer", "align": "right"}],
            "rows": [{"Gösterge": title or "Sonuç", "Değer": to_jsonable(result)}],
        }
    return payload


# ---------------------------------------------------------------------------
# Filters ("yaşı 30'dan büyük", "Satış departmanında", "ayrılanlar arasında")
# ---------------------------------------------------------------------------
class Filter:
    def __init__(self, col: str, op: str, value: Any):
        self.col, self.op, self.value = col, op, value

    def mask(self, df: pd.DataFrame) -> pd.Series:
        s = df[self.col]
        if self.op == ">":
            return s > self.value
        if self.op == ">=":
            return s >= self.value
        if self.op == "<":
            return s < self.value
        if self.op == "<=":
            return s <= self.value
        return s.astype(str) == str(self.value)

    def label(self) -> str:
        op = {">": ">", ">=": "≥", "<": "<", "<=": "≤", "==": "="}[self.op]
        return f"{self.col} {op} {fmt_num(self.value, self.col) if isinstance(self.value, (int, float)) else self.value}"


def _numeric_filters(f: str, cm: ColumnMatcher) -> list[Filter]:
    out: list[Filter] = []
    tokens = [(m.group(0), m.start()) for m in re.finditer(r"[a-z0-9_\-]+", f)]
    numeric = cm.numeric()
    for i, (tok, _pos) in enumerate(tokens):
        if not re.fullmatch(r"\d+(?:[.,]\d+)?", tok):
            continue
        number = float(tok.replace(",", "."))
        # operator within the next 3 tokens
        op = None
        window = [t for t, _ in tokens[i + 1 : i + 4]]
        joined = " ".join(window)
        if any(mark in joined for mark in _GE_MARK):
            op = ">="
        elif any(mark in joined for mark in _LE_MARK):
            op = "<="
        else:
            for w in window:
                stem = _SUFFIX_RE.sub("", w) if len(w) > 5 else w
                if w in _GT_WORDS or stem in _GT_WORDS:
                    op = ">"
                    break
                if w in _LT_WORDS or stem in _LT_WORDS:
                    op = "<"
                    break
                if w in _EQ_WORDS:
                    op = "=="
                    break
        if not op:
            continue
        # column: the token before the number, else the token right after
        col = None
        for cand_idx in (i - 1, i + 1, i - 2):
            if 0 <= cand_idx < len(tokens):
                cand = tokens[cand_idx][0]
                if cand in _GT_WORDS | _LT_WORDS | _EQ_WORDS or cand in ("ve", "veya", "daha"):
                    continue
                c = cm.match_phrase(cand)
                if c and c in numeric:
                    col = c
                    break
        if col:
            value = int(number) if number.is_integer() else number
            out.append(Filter(col, op, value))
    return out


_YES_PHRASES = [
    (r"(?<![a-z])ayril(an|anlar|anlarin|anlarda|di|mis|mislar|mistir)(?![a-z])", ["Ayrılma", "Attrition"], "yes"),
    (r"isten (cikan|cikanlar|cikmis|ayrilan|ayrilanlar)", ["Ayrılma", "Attrition"], "yes"),
    (r"(?<![a-z])(kalan|kalanlar|ayrilmayan|ayrilmayanlar|devam eden|devam edenler|calismaya devam)", ["Ayrılma", "Attrition"], "no"),
    (r"fazla mesai(si)? yap(an|anlar|anlarin|anlarda|ip|mis)", ["Fazla Mesai", "OverTime"], "yes"),
    (r"fazla mesai(si)? yapma(yan|yanlar|yanlarin)", ["Fazla Mesai", "OverTime"], "no"),
    (r"(?<![a-z])mesai(ye)? kal(an|anlar|anlarin)", ["Fazla Mesai", "OverTime"], "yes"),
]


def _categorical_filters(f: str, cm: ColumnMatcher, mentioned: list[str]) -> tuple[list[Filter], set[str]]:
    """Equality filters from category values found in the text. Returns the
    filters and the columns consumed by yes/no phrases (so they are not treated
    as analysis targets)."""
    out: list[Filter] = []
    consumed: set[str] = set()
    df = cm.df

    for pattern, cands, kind in _YES_PHRASES:
        if not re.search(pattern, f):
            continue
        col = next((c for c in cands if c in cm.columns), None)
        if not col or any(x.col == col for x in out):
            continue
        values = [str(v) for v in df[col].dropna().unique()]
        yes = next((v for v in values if fold(v).strip() in ("evet", "yes", "true", "1")), None)
        no = next((v for v in values if fold(v).strip() in ("hayir", "no", "false", "0")), None)
        target = yes if kind == "yes" else no
        if target is not None:
            out.append(Filter(col, "==", target))
            consumed.add(col)

    # value mentions, e.g. "Satış departmanında", "kadın çalışanlar", "bekar"
    candidates: list[tuple[int, str, str, int]] = []  # (position, col, value, nunique)
    for col in cm.text_categorical():
        if any(x.col == col for x in out):
            continue
        values = df[col].dropna().unique()
        for v in values:
            fv = fold(str(v)).strip()
            if len(fv) < 4 or fv in _GENERIC_VALUES:
                continue
            m = re.search(rf"(?<![a-z0-9]){re.escape(fv)}(?![a-z]{{4,}})", f)
            if m:
                candidates.append((m.start(), col, str(v), int(df[col].nunique())))
    # resolve the same value appearing in several columns (e.g. "İnsan Kaynakları")
    by_value: dict[str, list[tuple[int, str, str, int]]] = {}
    for cand in candidates:
        by_value.setdefault(fold(cand[2]), []).append(cand)
    for _, group in by_value.items():
        group.sort(key=lambda c: (c[1] not in mentioned, c[3]))
        pos, col, value, _n = group[0]
        if any(x.col == col for x in out):
            continue
        out.append(Filter(col, "==", value))
    return out, consumed


def extract_filters(f: str, cm: ColumnMatcher, mentioned: list[str]) -> tuple[list[Filter], set[str]]:
    num = _numeric_filters(f, cm)
    cat, consumed = _categorical_filters(f, cm, mentioned)
    consumed |= {x.col for x in num}
    return num + cat, consumed


def _apply_filters(df: pd.DataFrame, filters: list[Filter]) -> pd.DataFrame:
    if not filters:
        return df
    mask = pd.Series(True, index=df.index)
    for flt in filters:
        mask &= flt.mask(df)
    return df[mask]


def _filter_prefix(filters: list[Filter], n: int, total: int) -> str:
    if not filters:
        return ""
    return f"Filtre: {_join_tr([x.label() for x in filters])} → {_tr_int(n)} kayıt ({fmt_pct(100 * n / total if total else 0)} / {_tr_int(total)}). "


# ---------------------------------------------------------------------------
# Rule-based analyzer
# ---------------------------------------------------------------------------
_INTENTS = {
    "columns": ["sutun", "kolon", "alanlar", "hangi alan", "hangi veri", "degisken", "basliklar", "kolonlar"],
    "describe": ["ozet", "describe", "istatistik", "genel bakis", "betimsel", "tanimlayici"],
    "hist": ["histogram", "dagilim", "frekans"],
    "top": ["en yuksek", "en fazla", "en cok", "en buyuk", "en iyi", "en dusuk", "en az", "en kucuk", "en kotu", r"ilk(?=\s+\d)", r"top(?=\s+\d)", r"son(?=\s+\d)"],
    "count": ["kac", "sayisi", "sayilari", r"sayi(?![a-z])", "adet", "count", "kisi sayisi", "kimler"],
    "mean": ["ortalama", "mean", r"ort(?=\s|\.|$)", "ortalamasi"],
    "sum": ["toplam", "sum"],
    "median": ["medyan", "median", "ortanca"],
    "max": ["maksimum", r"max(?![a-z])"],
    "min": ["minimum", r"min(?![a-z])"],
    "corr": ["korelasyon", "iliski", "correlation", "baginti", "etkiliyor", "etkisi"],
    "rate": ["oran", "yuzde", "yuzdesi", "orani", "yuzdelik", "payi"],
    "help": ["yardim", "neler yapabilirsin", "ne yapabilirsin", "ornek", "merhaba", "selam", "nasilsin"],
    "list": ["listele", "goster", "getir", "ver", "kimler"],
}

_AGG_TR = {"mean": "Ortalama", "median": "Medyan", "sum": "Toplam", "max": "En Yüksek", "min": "En Düşük"}
_AGG_TR_LOWER = {"mean": "ortalama", "median": "medyan", "sum": "toplam", "max": "en yüksek", "min": "en düşük"}


def _has(f: str, keys: list[str]) -> bool:
    return any(re.search(rf"(?<![a-z0-9]){k}", f) for k in keys)


def _top_n(f: str) -> int:
    m = re.search(r"(?<![a-z0-9])(\d{1,3})(?![a-z0-9])", f)
    if m:
        return max(1, min(int(m.group(1)), MAX_ROWS))
    words = {"bes": 5, "on": 10, "uc": 3, "iki": 2, "yirmi": 20, "bir": 1, "yedi": 7, "sekiz": 8, "dokuz": 9, "dort": 4, "alti": 6}
    for w, n in words.items():
        if re.search(rf"(?<![a-z]){w}(?![a-z])", f):
            return n
    return 5


def _group_col(f: str, cm: ColumnMatcher, cols: list[str]) -> Optional[str]:
    """The grouping column: the phrase right before 'göre / bazında / itibarıyla',
    otherwise the first categorical column mentioned."""
    m = re.search(r"([a-z0-9_ \-]{3,40}?)\s+(gore|bazinda|bazli|itibariyle|itibariyla|kiriliminda|kirilimi)(?![a-z])", f)
    if m:
        tail = m.group(1).strip().split()
        for k in (2, 1):
            if len(tail) >= k:
                col = cm.match_phrase(" ".join(tail[-k:]))
                if col:
                    return col
    cats = cm.categorical()
    for c in cols:
        if c in cats:
            return c
    return None


def _nice_cut(s: pd.Series, k: int) -> tuple[pd.Series, list[str]]:
    """Cut a numeric series into k bins with human-friendly (integer when
    possible) edges; returns the categorical and its labels in order."""
    lo, hi = float(s.min()), float(s.max())
    integer_like = bool(pd.api.types.is_integer_dtype(s)) or float(s.dropna().astype(float).mod(1).abs().sum()) == 0
    if integer_like and hi - lo >= k:
        step = max(1, int(np.ceil((hi - lo + 1) / k)))
        start = int(np.floor(lo))
        edges = [start - 1] + [start + step * i - 1 for i in range(1, k + 1)]
        edges = [e for e in edges if e < hi] + [int(hi)]
        cut = pd.cut(s, bins=edges)
        labels = [f"{int(i.left) + 1}–{int(i.right)}" for i in cut.cat.categories]
    else:
        cut = pd.cut(s, bins=k, include_lowest=True)
        labels = [f"{fmt_num(round(i.left, 1))}–{fmt_num(round(i.right, 1))}" for i in cut.cat.categories]
    return cut, labels


def _binary_yes(df: pd.DataFrame, col: str) -> Optional[str]:
    values = [str(v) for v in df[col].dropna().unique()]
    if len(values) > 2:
        return None
    for v in values:
        if fold(v).strip() in ("evet", "yes", "true", "1"):
            return v
    return None


def _default_metric(cm: ColumnMatcher) -> str:
    for c in ("Aylık Gelir", "MonthlyIncome"):
        if c in cm.columns:
            return c
    return cm.metrics()[0] if cm.metrics() else cm.numeric()[0]


def _pick_show_columns(df: pd.DataFrame, metric: str, extra: list[str]) -> list[str]:
    show: list[str] = []
    for c in ["Personel No", "EmployeeNumber", "Departman", "Department", "Pozisyon", "JobRole", "Yaş", "Age", "Cinsiyet", "Gender", metric, *extra]:
        if c in df.columns and c not in show:
            show.append(c)
    return show


def rule_based_answer(message: str, df_full: pd.DataFrame) -> dict:
    cm = ColumnMatcher(df_full)
    f = fold(message)
    mentioned = cm.find_all(message)
    numeric = cm.numeric()
    total = len(df_full)

    # help / greeting --------------------------------------------------------
    if _has(f, _INTENTS["help"]) and not mentioned:
        return {"reply": (
            f"Merhaba! Elimdeki veri setinde {_tr_int(total)} satır ve {df_full.shape[1]} sütun var. Şunları deneyebilirsiniz:\n"
            "• \"Departmanlara göre ortalama maaşları göster\"\n"
            "• \"Yaş dağılımı histogramını çiz\"\n"
            "• \"En yüksek maaşı alan 5 kişiyi listele\"\n"
            "• \"Departmanlara göre ayrılma oranı nedir?\"\n"
            "• \"Yaşı 40'tan büyük kadın çalışanların ortalama geliri\"\n"
            "• \"Aylık gelir ile toplam deneyim arasındaki ilişki\"\n"
            "• \"Veri setini özetle\" veya \"Sütunları listele\""
        )}

    # columns ---------------------------------------------------------------
    if _has(f, _INTENTS["columns"]) and not _has(f, _INTENTS["mean"] + _INTENTS["top"] + _INTENTS["hist"]):
        info = frame_columns(df_full)
        kind_tr = {"number": "Sayısal", "string": "Kategorik / Metin", "date": "Tarih"}
        rows = [{"Sütun": c["key"], "Tip": kind_tr.get(c["kind"], c["kind"]), "Farklı Değer": int(df_full[c["key"]].nunique()), "Boş Değer": c["nulls"]} for c in info]
        cats = cm.text_categorical()
        return {
            "reply": (
                f"Veri setinde {_tr_int(total)} satır ve {len(info)} sütun bulunuyor. "
                f"{len([c for c in info if c['kind'] == 'number'])} sayısal, {len([c for c in info if c['kind'] != 'number'])} kategorik sütun var. "
                f"Kategorik sütunlar: {_join_tr(cats[:8])}. "
                f"Örnek sayısal sütunlar: {_join_tr([c for c in cm.metrics()[:6]])}."
            ),
            "table": {
                "columns": [
                    {"key": "Sütun", "label": "Sütun"},
                    {"key": "Tip", "label": "Tip"},
                    {"key": "Farklı Değer", "label": "Farklı Değer", "align": "right"},
                    {"key": "Boş Değer", "label": "Boş Değer", "align": "right"},
                ],
                "rows": rows[:MAX_ROWS],
            },
        }

    # filters ---------------------------------------------------------------
    filters, consumed = extract_filters(f, cm, mentioned)
    df = _apply_filters(df_full, filters)
    n = len(df)
    cols = [c for c in mentioned if c not in consumed]
    prefix = _filter_prefix(filters, n, total)
    if filters and n == 0:
        return {"reply": prefix + "Bu koşullara uyan kayıt bulunamadı. Filtreyi gevşetmeyi deneyin."}

    # describe --------------------------------------------------------------
    if _has(f, _INTENTS["describe"]):
        target = [c for c in cols if c in numeric] or cm.metrics()[:10]
        desc = df[target].describe().T
        desc = desc.rename(columns={"count": "Adet", "mean": "Ortalama", "std": "Std. Sapma", "min": "Min", "25%": "%25", "50%": "Medyan", "75%": "%75", "max": "Maks"})
        desc = desc.round(2).reset_index().rename(columns={"index": "Sütun"})
        return {"reply": prefix + f"{len(target)} sayısal sütun için özet istatistikler: adet, ortalama, standart sapma, en düşük, çeyrekler ve en yüksek değerler.", "table": frame_to_table(desc)}

    # correlation -----------------------------------------------------------
    if _has(f, _INTENTS["corr"]):
        target = [c for c in cols if c in numeric]
        if len(target) >= 2:
            a, b = target[0], target[1]
            r = float(df[a].corr(df[b]))
            strength = "çok güçlü" if abs(r) >= 0.8 else "güçlü" if abs(r) >= 0.6 else "orta" if abs(r) >= 0.4 else "zayıf" if abs(r) >= 0.2 else "çok zayıf"
            direction = "pozitif" if r > 0 else "negatif"
            # binned view: mean of a per bins of b (or per category of b)
            if df[b].nunique() > 12:
                cut, labels = _nice_cut(df[b], min(8, max(4, int(df[b].nunique() ** 0.5 / 2))))
                g = df.groupby(cut, observed=False)[a].mean().round(2)
                g.index = labels
            else:
                g = df.groupby(b)[a].mean().round(2).sort_index()
            g.index.name = b
            g.name = f"Ortalama {a}"
            return {
                "reply": prefix + (
                    f"{a} ile {b} arasındaki Pearson korelasyonu {_tr_float(r, 3)}: {strength} {direction} bir ilişki. "
                    f"{'Biri arttıkça diğeri de artma eğiliminde.' if r > 0 else 'Biri arttıkça diğeri azalma eğiliminde.'} "
                    f"Tablo, {b} aralıklarına göre ortalama {a} değerini gösteriyor."
                ),
                "table": series_to_table(g),
                "chart": series_to_chart(g, "bar", f"{b} aralığına göre ortalama {a}"),
            }
        base = target[0] if target else _default_metric(cm)
        corr = df[cm.metrics()].corr()[base].drop(base).sort_values(key=abs, ascending=False).head(10).round(3)
        corr.name = "Korelasyon (Pearson)"
        corr.index.name = "Sütun"
        return {
            "reply": prefix + f"{base} ile en güçlü ilişkiye sahip sütunlar: {corr.index[0]} ({_tr_float(corr.iloc[0], 3)}), {corr.index[1]} ({_tr_float(corr.iloc[1], 3)}) ve {corr.index[2]} ({_tr_float(corr.iloc[2], 3)}).",
            "table": series_to_table(corr),
            "chart": series_to_chart(corr, "bar", f"{base} korelasyonları"),
        }

    # histogram / distribution / crosstab ----------------------------------
    if _has(f, _INTENTS["hist"]):
        cats = cm.categorical()
        group = _group_col(f, cm, cols)
        target_cands = [c for c in cols if c != group]
        target = target_cands[0] if target_cands else (cols[0] if cols and cols[0] != group else None)
        if target is None:
            target = "Yaş" if "Yaş" in df.columns else ("Age" if "Age" in df.columns else cm.metrics()[0])
        if group and target and group != target and group in cats and target in cats:
            ct = pd.crosstab(df[group], df[target])
            ct.columns = [str(c) for c in ct.columns]
            pct = pd.crosstab(df[group], df[target], normalize="index").round(4) * 100
            top_grp = ct.sum(axis=1).idxmax()
            return {
                "reply": prefix + f"{group} kırılımında {target} dağılımı ({ct.shape[0]} grup × {ct.shape[1]} değer, {_tr_int(n)} kayıt). En kalabalık grup {top_grp} ({_tr_int(ct.sum(axis=1).max())} kişi).",
                "table": frame_to_table(ct),
                "chart": frame_to_chart(ct.reset_index(), "bar", group, list(ct.columns), f"{group} × {target}"),
                "percentTable": frame_to_table(pct.round(1)),
            }
        s = df[target].dropna()
        if pd.api.types.is_numeric_dtype(s) and s.nunique() > 12:
            bins = min(10, max(5, int(np.sqrt(len(s)) / 4)))
            cut, labels = _nice_cut(s, bins)
            vc = cut.value_counts().sort_index()
            bins = len(labels)
            counts = pd.Series(vc.values, index=labels, name="Kişi Sayısı")
            counts.index.name = target
            mode_label = labels[int(np.argmax(vc.values))]
            return {
                "reply": prefix + (
                    f"{target} dağılımı {bins} aralığa bölündü. Ortalama {fmt_num(s.mean(), target)}, medyan {fmt_num(s.median(), target)}, "
                    f"en düşük {fmt_num(s.min(), target)}, en yüksek {fmt_num(s.max(), target)}. En yoğun aralık {mode_label} ({_tr_int(vc.max())} kişi)."
                ),
                "table": series_to_table(counts),
                "chart": series_to_chart(counts, "histogram", f"{target} dağılımı"),
            }
        vc = s.value_counts()
        vc.name = "Kişi Sayısı"
        vc.index.name = target
        share = 100 * vc.iloc[0] / n if n else 0
        return {
            "reply": prefix + f"{target} sütununda {vc.size} farklı değer var. En sık görülen {vc.index[0]} ({_tr_int(vc.iloc[0])} kişi, {fmt_pct(share)}), en seyrek {vc.index[-1]} ({_tr_int(vc.iloc[-1])} kişi).",
            "table": series_to_table(vc),
            "chart": series_to_chart(vc, "pie" if vc.size <= 6 else "bar", f"{target} dağılımı"),
        }

    # top / bottom N --------------------------------------------------------
    if _has(f, _INTENTS["top"]) and (cols or numeric):
        k = _top_n(f)
        asc = _has(f, ["en dusuk", "en az", "en kucuk", "en kotu", r"son(?=\s+\d)"])
        metric_cands = [c for c in cols if c in cm.metrics()]
        metric = metric_cands[0] if metric_cands else _default_metric(cm)
        group = _group_col(f, cm, [c for c in cols if c != metric])
        agg_key = next((key for key in ("median", "sum", "max", "min", "mean") if _has(f, _INTENTS[key])), None)
        if group and (agg_key or _has(f, ["gore", "bazinda", "bazli"]) or _has(f, _INTENTS["count"])):
            if _has(f, _INTENTS["count"]) and not agg_key:
                g = df[group].value_counts()
                g = g.nsmallest(k) if asc else g.nlargest(k)
                g.name = "Kişi Sayısı"
                g.index.name = group
                return {
                    "reply": prefix + f"Kişi sayısı en {'düşük' if asc else 'yüksek'} {len(g)} {group.lower()} grubu: {_join_tr([f'{i} ({_tr_int(v)})' for i, v in g.items()])}.",
                    "table": series_to_table(g),
                    "chart": series_to_chart(g, "bar", f"{group} bazında kişi sayısı"),
                }
            agg_key = agg_key or "mean"
            g = getattr(df.groupby(group)[metric], agg_key)().round(2)
            g = g.nsmallest(k) if asc else g.nlargest(k)
            g.name = f"{_AGG_TR[agg_key]} {metric}"
            g.index.name = group
            return {
                "reply": prefix + f"{group} bazında {_AGG_TR_LOWER[agg_key]} {metric} değeri en {'düşük' if asc else 'yüksek'} {len(g)} grup: {_join_tr([f'{i} ({fmt_num(v, metric)})' for i, v in g.items()])}.",
                "table": series_to_table(g),
                "chart": series_to_chart(g, "bar", f"{group} bazında {_AGG_TR_LOWER[agg_key]} {metric}"),
            }
        picked = df.nsmallest(k, metric) if asc else df.nlargest(k, metric)
        show = _pick_show_columns(df, metric, [c for c in cols if c != metric])
        out = picked[show].reset_index(drop=True)
        out.index = out.index + 1
        out.index.name = "Sıra"
        first = out.iloc[0]
        who = f"{first['Personel No']} numaralı personel" if "Personel No" in out.columns else "ilk kayıt"
        return {
            "reply": prefix + (
                f"{metric} değeri en {'düşük' if asc else 'yüksek'} {len(out)} kişi listelendi. "
                f"{'En düşük' if asc else 'En yüksek'} değer {fmt_num(first[metric], metric)} ile {who}"
                + (f" ({first['Departman']}, {first['Pozisyon']})" if "Departman" in out.columns and "Pozisyon" in out.columns else "")
                + f". Listenin ortalaması {fmt_num(out[metric].mean(), metric)}."
            ),
            "table": frame_to_table(out),
            "chart": frame_to_chart(out.reset_index(), "bar", "Sıra", [metric], f"En {'düşük' if asc else 'yüksek'} {metric}"),
        }

    # rate / percentage of a categorical target -----------------------------
    metric_cands = [c for c in cols if c in cm.metrics()]
    agg = next((key for key in ("mean", "median", "sum", "max", "min") if _has(f, _INTENTS[key])), None)
    if _has(f, _INTENTS["rate"]) and not metric_cands:
        group = _group_col(f, cm, cols)
        cat_targets = [c for c in cols if c != group and c in cm.categorical()]
        target = cat_targets[0] if cat_targets else next((c for c in ("Ayrılma", "Attrition") if c in df.columns), None)
        if target:
            yes = _binary_yes(df, target)
            if yes is not None:
                label = f"{target} Oranı (%)"
                overall = 100 * (df[target].astype(str) == yes).mean()
                if group and group != target:
                    g = (df.groupby(group)[target].apply(lambda s: 100 * (s.astype(str) == yes).mean())).round(1).sort_values(ascending=False)
                    g.name = label
                    g.index.name = group
                    counts = df.groupby(group)[target].apply(lambda s: int((s.astype(str) == yes).sum()))
                    tbl = pd.DataFrame({group: g.index, label: g.values, f"{target} = {yes} (kişi)": counts.reindex(g.index).values, "Toplam Kişi": df[group].value_counts().reindex(g.index).values})
                    return {
                        "reply": prefix + (
                            f"{group} bazında {target.lower()} oranı: genel oran {fmt_pct(overall)}. "
                            f"En yüksek {g.index[0]} ({fmt_pct(g.iloc[0])}), en düşük {g.index[-1]} ({fmt_pct(g.iloc[-1])})."
                        ),
                        "table": frame_to_table(tbl),
                        "chart": series_to_chart(g, "bar", f"{group} bazında {target} oranı (%)"),
                    }
                cnt = int((df[target].astype(str) == yes).sum())
                return {"reply": prefix + f"Genel {target.lower()} oranı {fmt_pct(overall)}: {_tr_int(n)} kişiden {_tr_int(cnt)} kişi {target} = {yes}."}
            # multi-class target → share of each value (optionally per group)
            if group and group != target:
                pct = (pd.crosstab(df[group], df[target], normalize="index") * 100).round(1)
                pct.columns = [f"{c} (%)" for c in pct.columns]
                return {
                    "reply": prefix + f"{group} bazında {target} yüzde dağılımı (satır toplamları %100).",
                    "table": frame_to_table(pct),
                    "chart": frame_to_chart(pct.reset_index(), "bar", group, list(pct.columns), f"{group} × {target} (%)"),
                }
            vc = (df[target].value_counts(normalize=True) * 100).round(1)
            vc.name = "Pay (%)"
            vc.index.name = target
            return {
                "reply": prefix + f"{target} yüzde dağılımı: {_join_tr([f'{i} {fmt_pct(v)}' for i, v in vc.head(6).items()])}.",
                "table": series_to_table(vc),
                "chart": series_to_chart(vc, "pie" if vc.size <= 6 else "bar", f"{target} dağılımı (%)"),
            }

    # aggregate (mean / median / sum / max / min), optionally grouped --------
    if agg and (metric_cands or not _has(f, _INTENTS["count"])):
        metric = metric_cands[0] if metric_cands else _default_metric(cm)
        group = _group_col(f, cm, [c for c in cols if c != metric])
        if group == metric:
            group = None
        if group:
            g = getattr(df.groupby(group)[metric], agg)().round(2).sort_values(ascending=False)
            g.name = f"{_AGG_TR[agg]} {metric}"
            g.index.name = group
            counts = df[group].value_counts().reindex(g.index)
            tbl = pd.DataFrame({group: g.index, g.name: g.values, "Kişi Sayısı": counts.values})
            overall = getattr(df[metric], agg)()
            return {
                "reply": prefix + (
                    f"{group} bazında {_AGG_TR_LOWER[agg]} {metric}: {len(g)} grup. "
                    f"En yüksek {g.index[0]} ({fmt_num(g.iloc[0], metric)}), en düşük {g.index[-1]} ({fmt_num(g.iloc[-1], metric)}); "
                    f"genel {_AGG_TR_LOWER[agg]} {fmt_num(overall, metric)}."
                ),
                "table": frame_to_table(tbl),
                "chart": series_to_chart(g, "bar", f"{group} bazında {_AGG_TR_LOWER[agg]} {metric}"),
            }
        s = df[metric]
        val = getattr(s, agg)()
        summary = pd.DataFrame([{
            "Gösterge": f"{_AGG_TR[agg]} {metric}", "Değer": round(float(val), 2), "Kişi Sayısı": int(n),
            "Medyan": round(float(s.median()), 2), "En Düşük": to_jsonable(s.min()), "En Yüksek": to_jsonable(s.max()),
        }])
        payload: dict[str, Any] = {
            "reply": prefix + f"{metric} {_AGG_TR_LOWER[agg]} değeri {fmt_num(val, metric)} ({_tr_int(n)} kayıt; medyan {fmt_num(s.median(), metric)}, en düşük {fmt_num(s.min(), metric)}, en yüksek {fmt_num(s.max(), metric)}).",
            "table": frame_to_table(summary),
        }
        # single categorical filter → comparison against the other groups
        cat_filters = [x for x in filters if x.op == "==" and x.col in cm.categorical()]
        if len(cat_filters) == 1 and df_full[cat_filters[0].col].nunique() <= 12:
            base = _apply_filters(df_full, [x for x in filters if x is not cat_filters[0]])
            cmp_col = cat_filters[0].col
            g = getattr(base.groupby(cmp_col)[metric], agg)().round(2).sort_values(ascending=False)
            g.name = f"{_AGG_TR[agg]} {metric}"
            g.index.name = cmp_col
            others = [f"{i} {fmt_num(v, metric)}" for i, v in g.items() if str(i) != str(cat_filters[0].value)]
            payload["reply"] += f" Karşılaştırma – {cmp_col}: {_join_tr(others)}."
            payload["table"] = series_to_table(g)
            payload["chart"] = series_to_chart(g, "bar", f"{cmp_col} bazında {_AGG_TR_LOWER[agg]} {metric}")
        return payload

    # counts ----------------------------------------------------------------
    if _has(f, _INTENTS["count"]) or cols or filters:
        group = _group_col(f, cm, cols) or next((c for c in cols if c in cm.categorical()), None)
        if group:
            second = next((c for c in cols if c != group and c in cm.categorical()), None)
            if second:
                ct = pd.crosstab(df[group], df[second])
                ct.columns = [str(c) for c in ct.columns]
                return {
                    "reply": prefix + f"{group} × {second} çapraz tablosu ({_tr_int(n)} kayıt). Satırlar {group}, sütunlar {second} değerleri; hücreler kişi sayısı.",
                    "table": frame_to_table(ct),
                    "chart": frame_to_chart(ct.reset_index(), "bar", group, list(ct.columns), f"{group} × {second}"),
                }
            vc = df[group].value_counts()
            vc.name = "Kişi Sayısı"
            vc.index.name = group
            pct = (100 * vc / n).round(1)
            tbl = pd.DataFrame({group: vc.index, "Kişi Sayısı": vc.values, "Pay (%)": pct.values})
            return {
                "reply": prefix + f"{group} bazında kişi sayısı: {vc.size} grup, toplam {_tr_int(n)} kişi. En kalabalık {vc.index[0]} ({_tr_int(vc.iloc[0])} kişi, {fmt_pct(pct.iloc[0])}), en küçük {vc.index[-1]} ({_tr_int(vc.iloc[-1])} kişi).",
                "table": frame_to_table(tbl),
                "chart": series_to_chart(vc, "pie" if vc.size <= 6 else "bar", f"{group} bazında kişi sayısı"),
            }
        if cols and cols[0] in numeric:
            s = df[cols[0]]
            return {"reply": prefix + f"{cols[0]}: {_tr_int(n)} kayıt, ortalama {fmt_num(s.mean(), cols[0])}, medyan {fmt_num(s.median(), cols[0])}, en düşük {fmt_num(s.min(), cols[0])}, en yüksek {fmt_num(s.max(), cols[0])}."}
        if filters:
            show = _pick_show_columns(df, _default_metric(cm), [x.col for x in filters])
            return {"reply": prefix + f"Koşullara uyan {_tr_int(n)} kayıt bulundu; ilk {min(n, 10)} tanesi listeleniyor.", "table": frame_to_table(df[show].head(10))}
        return {"reply": f"Veri setinde toplam {_tr_int(total)} kayıt ve {df_full.shape[1]} sütun bulunuyor."}

    # fallback: preview -----------------------------------------------------
    return {
        "reply": (
            f"Sorunuzu tam eşleştiremedim. Veri setinde {_tr_int(total)} satır ve {df_full.shape[1]} sütun var; ilk 10 satırı gösteriyorum. "
            "Şunları deneyebilirsiniz: \"Departmanlara göre ortalama maaş\", \"Yaş dağılımı histogramı\", "
            "\"En yüksek maaşı alan 5 kişi\", \"Departmanlara göre ayrılma oranı\", \"Sütunları listele\"."
        ),
        "table": frame_to_table(df_full.head(10)),
    }


# ---------------------------------------------------------------------------
# LLM path with sandboxed executor
# ---------------------------------------------------------------------------
_SAFE_BUILTINS = {
    "abs": abs, "all": all, "any": any, "bool": bool, "dict": dict, "enumerate": enumerate, "float": float,
    "int": int, "len": len, "list": list, "max": max, "min": min, "range": range, "round": round, "set": set,
    "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "zip": zip, "map": map, "filter": filter,
    "isinstance": isinstance, "reversed": reversed, "True": True, "False": False, "None": None,
}

_FORBIDDEN = re.compile(
    r"(__import__|\bimport\b|\bexec\b|\beval\b|\bopen\b|\bcompile\b|\bglobals\b|\blocals\b|\bgetattr\b|\bsetattr\b|"
    r"\bdelattr\b|\bvars\b|\binput\b|\bbreakpoint\b|__[a-zA-Z]+__|\bos\.|\bsys\.|\bsubprocess|\bshutil|\bsocket|"
    r"\.to_csv\(|\.to_excel\(|\.to_pickle\(|\.read_csv\(|\.read_excel\(|\.to_sql\(|\bpd\.read_|\bnp\.load|\bnp\.save)"
)


class SandboxError(Exception):
    pass


def run_sandboxed(code: str, df: pd.DataFrame, timeout: float = EXEC_TIMEOUT) -> dict:
    if _FORBIDDEN.search(code):
        raise SandboxError("Üretilen kod izin verilmeyen bir ifade içeriyor.")
    ns: dict[str, Any] = {"__builtins__": _SAFE_BUILTINS, "pd": pd, "np": np, "df": df.copy()}
    outcome: dict[str, Any] = {}

    def _target():
        try:
            exec(compile(code, "<llm>", "exec"), ns)  # noqa: S102 – restricted namespace
            outcome["ok"] = True
        except Exception as exc:  # pragma: no cover
            outcome["error"] = f"{type(exc).__name__}: {exc}"

    t = threading.Thread(target=_target, daemon=True)
    t.start()
    t.join(timeout)
    if t.is_alive():
        raise SandboxError(f"Kod {timeout:.0f} saniye içinde tamamlanmadı.")
    if "error" in outcome:
        raise SandboxError(outcome["error"])
    return {"result": ns.get("result"), "chart": ns.get("chart") if isinstance(ns.get("chart"), dict) else None}


def _schema_text(df: pd.DataFrame) -> str:
    """Compact schema: one short line per column (keeps the prompt small for
    Groq's per-minute token limits)."""
    lines = []
    for c in df.columns:
        s = df[c]
        if pd.api.types.is_numeric_dtype(s):
            if s.nunique() <= 6:
                lines.append(f'"{c}": sayısal, değerler {sorted(int(v) if float(v).is_integer() else v for v in s.dropna().unique())}')
            else:
                lines.append(f'"{c}": sayısal {to_jsonable(s.min())}–{to_jsonable(s.max())}')
        else:
            vals = list(s.dropna().unique())
            shown = ", ".join(f'"{v}"' for v in vals[:9]) + (" …" if len(vals) > 9 else "")
            lines.append(f'"{c}": kategorik ({shown})')
    return "\n".join(lines)


def _system_prompt(df: pd.DataFrame) -> str:
    return (
        "Sen bir veri analizi asistanısın. Kullanıcının sorusunu `df` adlı pandas DataFrame üzerinde çalışan "
        f"Python/pandas koduna çevirirsin. df: {len(df)} satır. Sütunlar (adları BİREBİR böyle kullan):\n"
        f"{_schema_text(df)}\n\n"
        'SADECE şu JSON nesnesini döndür, başka hiçbir şey yazma: {"title": "<Türkçe kısa başlık>", "code": "<python>"}\n'
        "Kod kuralları:\n"
        "- Sadece pd, np, df kullan. import, dosya, ağ, exec/eval, print yok.\n"
        '- Maaş / gelir / ücret / kazanç soruları için "Aylık Gelir" sütununu kullan ("Aylık Ücret" ve "Günlük Ücret" farklı tarifelerdir; yalnızca açıkça istenirse).\n'
        '- Gruplama sonucu Series ise .rename("Ortalama Aylık Gelir") gibi Türkçe bir ad ver.\n'
        '- Histogram / dağılım: sayısal sütunu pd.cut ile 8-10 aralığa böl, etiketleri "18–22" gibi metin yap; result = aralık sütunu ve "Kişi Sayısı" sütunlu DataFrame (her tekil değer için satır ÜRETME).\n'
        '- Kişi listesi: SADECE ilgili 5-7 sütunu seç (örn. "Personel No", "Departman", "Pozisyon", "Yaş", "Cinsiyet" ve istenen sütun); tüm sütunları döndürme.\n'
        '- İlişki / korelasyon: result = df["A"].corr(df["B"]).round(3) (skaler), chart atama.\n'
        '- Sütun listesi: result = pd.DataFrame({"Sütun": df.columns, "Tip": ["Sayısal" if pd.api.types.is_numeric_dtype(t) else "Kategorik" for t in df.dtypes]}).\n'
        '- Sütun adlarını df["Aylık Gelir"] gibi tırnak içinde birebir yaz.\n'
        "- Sonucu `result` değişkenine ata: gruplama için index'i grup olan Series veya DataFrame; tek sayı için skaler; kişi listesi için ilgili sütunlarla DataFrame (.head(50)).\n"
        '- Sonuç sütun adları Türkçe olsun ("Ortalama Aylık Gelir", "Kişi Sayısı", "Ayrılma Oranı (%)"). Oranlar 0-100 yüzde. Sayılar .round(2). Gruplamada sort_values.\n'
        '- Grafik uygunsa chart = {"type": "bar"|"line"|"pie"|"histogram", "x": "<sütun>", "y": "<sütun veya liste>", "title": "<Türkçe>"} ata.\n'
        '- Kategorik değerler Türkçe: Ayrılma/Fazla Mesai "Evet"/"Hayır", Cinsiyet "Kadın"/"Erkek".\n'
    )


def _extract_json(content: str) -> Optional[dict]:
    """Tolerant JSON extraction: strips <think> blocks and ``` fences, then
    takes the first parseable {...} object."""
    text = re.sub(r"<think>.*?</think>", "", content, flags=re.S).strip()
    text = re.sub(r"^```(?:json|python)?\s*", "", text, flags=re.I).strip()
    text = re.sub(r"\s*```$", "", text).strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    decoder = json.JSONDecoder()
    for m in re.finditer(r"\{", text):
        try:
            data, _ = decoder.raw_decode(text[m.start():])
            if isinstance(data, dict) and ("code" in data or "explanation" in data or "title" in data):
                return data
        except Exception:
            continue
    code_m = re.search(r'"code"\s*:\s*"(.*?)"\s*(?:,|\})', text, re.S)
    if code_m:
        try:
            return {"code": json.loads(f'"{code_m.group(1)}"')}
        except Exception:
            return None
    return None


def _clean_code(code: str) -> str:
    code = code.strip()
    code = re.sub(r"^```(?:python)?\s*", "", code, flags=re.I)
    code = re.sub(r"\s*```$", "", code)
    return code.strip()


def _model_chain() -> list[str]:
    primary = (os.getenv("OPENAI_MODEL") or "gpt-4o").strip()
    fallback = (os.getenv("OPENAI_MODEL_FALLBACK") or "").strip()
    chain = [primary]
    if fallback and fallback != primary:
        chain.append(fallback)
    return chain


def _is_json_format_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return "json_validate_failed" in text or "response_format" in text or "json_object" in text or "failed to generate json" in text


def _retry_after(exc: Exception) -> Optional[float]:
    """Seconds suggested by a 429 ('try again in 934.28ms' / '13.4s')."""
    text = str(exc)
    if "429" not in text and "rate_limit" not in text.lower():
        return None
    m = re.search(r"try again in\s*([\d.]+)\s*(ms|s)", text, re.I)
    if not m:
        return 5.0
    value = float(m.group(1))
    return value / 1000.0 if m.group(2).lower() == "ms" else value


MAX_RATE_WAIT = 20.0


def _complete(client: Any, model: str, messages: list[dict], use_json_format: bool, max_tokens: int = LLM_MAX_TOKENS, temperature: float = 0.1) -> str:
    kwargs: dict[str, Any] = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
    if use_json_format:
        kwargs["response_format"] = {"type": "json_object"}
    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""


def _complete_resilient(client: Any, model: str, messages: list[dict], use_json_format: bool, errors: list[str], **kw: Any) -> Optional[str]:
    """One completion with: json_object → plain retry, and a single wait on a
    short 429. Returns None (and records the error) when the model is unusable."""
    use_json = use_json_format
    waited = False
    for _ in range(3):
        try:
            return _complete(client, model, messages, use_json, **kw)
        except Exception as exc:
            if use_json and _is_json_format_error(exc):
                log.info("%s rejected response_format, retrying without it", model)
                use_json = False
                continue
            wait = _retry_after(exc)
            if wait is not None and not waited and wait <= MAX_RATE_WAIT:
                log.info("%s rate limited, waiting %.1fs", model, wait)
                time.sleep(wait + 0.4)
                waited = True
                continue
            errors.append(f"{model}: {str(exc)[:300]}")
            log.warning("LLM call failed (%s): %s", model, exc)
            return None
    errors.append(f"{model}: tekrar denemeler başarısız")
    return None


# -- explanation from the *actual* result ------------------------------------
def _result_digest(result: Any) -> str:
    if isinstance(result, pd.DataFrame):
        limit = MAX_ROWS if result.shape[1] <= 4 else 20
        d = _normalise_index(result.head(limit).copy())
        d.columns = [str(c) for c in d.columns]
        lines = [" | ".join(d.columns)]
        for rec in d.itertuples(index=False, name=None):
            lines.append(" | ".join(str(to_jsonable(v)) for v in rec))
        more = f"\n(gösterilen: ilk {limit} satır; toplam {len(result)} satır)" if len(result) > limit else f"\n(toplam {len(result)} satır)"
        return "\n".join(lines) + more
    if isinstance(result, pd.Series):
        sr = result.head(MAX_ROWS)
        lines = [f"{sr.index.name or 'Grup'} | {sr.name or 'Değer'}"]
        lines += [f"{to_jsonable(k)} | {to_jsonable(v)}" for k, v in sr.items()]
        more = f"\n(gösterilen: ilk {MAX_ROWS} satır; toplam {len(result)} satır)" if len(result) > MAX_ROWS else f"\n(toplam {len(result)} satır)"
        return "\n".join(lines) + more
    if isinstance(result, dict):
        return "\n".join(f"{k}: {to_jsonable(v)}" for k, v in list(result.items())[:20])
    return str(to_jsonable(result))


def _auto_explain(result: Any, title: str = "") -> str:
    """Deterministic Turkish summary used when no explanation call is possible."""
    lead = f"{title.strip().rstrip('.')}. " if title else ""
    if isinstance(result, pd.Series) and pd.api.types.is_numeric_dtype(result) and 1 < len(result) <= MAX_ROWS:
        name = str(result.name or "Değer")
        grp = str(result.index.name or "Grup")
        srt = result.sort_values(ascending=False)
        return lead + f"{grp} bazında {name}: {len(result)} grup. En yüksek {srt.index[0]} ({fmt_num(srt.iloc[0], name)}), en düşük {srt.index[-1]} ({fmt_num(srt.iloc[-1], name)})."
    if isinstance(result, pd.DataFrame) and not result.empty:
        d = _normalise_index(result.copy())
        cats = [c for c in d.columns if not pd.api.types.is_numeric_dtype(d[c])]
        nums = [c for c in d.columns if pd.api.types.is_numeric_dtype(d[c]) and str(c) not in _ID_COLS]
        if cats and nums and len(d) <= MAX_ROWS:
            cat, num = cats[0], nums[0]
            srt = d.sort_values(num, ascending=False)
            return lead + f"{cat} bazında {num}: {len(d)} satır. En yüksek {srt[cat].iloc[0]} ({fmt_num(srt[num].iloc[0], str(num))}), en düşük {srt[cat].iloc[-1]} ({fmt_num(srt[num].iloc[-1], str(num))})."
        return lead + f"Sonuç tablosu {_tr_int(len(result))} satır ve {result.shape[1]} sütun içeriyor."
    if isinstance(result, (int, float, np.integer, np.floating)):
        return lead + f"Sonuç: {fmt_num(result)}."
    return lead or "Analiz tamamlandı."


def _explain_with_llm(client: Any, models: list[str], question: str, result: Any, title: str, errors: list[str]) -> Optional[str]:
    digest = _result_digest(result)
    if len(digest) > 3500:
        digest = digest[:3500] + "\n(…)"
    messages = [
        {"role": "system", "content": (
            "Sen Türkçe konuşan bir veri analisti asistanısın. Sana bir kullanıcı sorusu ve bu soru için HESAPLANMIŞ sonuç verilecek. "
            "Sonucu 1-3 cümlede, akıcı ve doğal Türkçe ile açıkla. Kurallar: sadece verilen sayıları kullan, asla yeni sayı uydurma; "
            "en yüksek/en düşük ya da ana bulguyu belirt; sayıları Türkçe biçimle yaz (binlik ayırıcı nokta, ondalık virgül: 6.959,17; "
            "yüzdeler %16,1; gelir/ücret değerlerinde 'TL' yazma, başa ₺ sembolü koy: ₺6.959). Satır/sütun sayısını 'Hesaplanan sonuç' bölümündeki toplam bilgisinden al. İngilizce kelime, kod, JSON veya madde işareti kullanma. Sadece açıklama metnini döndür."
        )},
        {"role": "user", "content": f"Soru: {question}\nBaşlık: {title or '-'}\nHesaplanan sonuç:\n{digest}"},
    ]
    for model in models:
        content = _complete_resilient(client, model, messages, False, errors, max_tokens=400, temperature=0.2)
        if content:
            text = re.sub(r"<think>.*?</think>", "", content, flags=re.S).strip().strip('"')
            if text:
                return text
    return None


def llm_answer(message: str, history: list[dict], df: pd.DataFrame) -> Optional[dict]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
    except Exception as exc:  # pragma: no cover
        log.warning("openai import failed: %s", exc)
        return None

    client = OpenAI(api_key=api_key, base_url=os.getenv("OPENAI_BASE_URL") or None, timeout=45.0, max_retries=0)
    base_messages = [{"role": "system", "content": _system_prompt(df)}]
    for h in history[-6:]:
        if h.get("role") in ("user", "assistant") and h.get("content"):
            base_messages.append({"role": h["role"], "content": str(h["content"])[:1500]})
    base_messages.append({"role": "user", "content": message})

    errors: list[str] = []
    chain = _model_chain()
    for model in chain:
        messages = list(base_messages)
        last_error: Optional[str] = None
        for attempt in range(2):  # one repair round for JSON / sandbox errors
            content = _complete_resilient(client, model, messages, True, errors)
            if content is None:
                break
            data = _extract_json(content)
            if data is None:
                if attempt == 0:
                    messages.append({"role": "assistant", "content": content})
                    messages.append({"role": "user", "content": 'Yanıt geçerli JSON değildi. SADECE {"title": "...", "code": "..."} biçiminde JSON döndür.'})
                    continue
                errors.append(f"{model}: JSON ayrıştırılamadı")
                break
            code = _clean_code(str(data.get("code") or ""))
            title = str(data.get("title") or "").strip()
            pre_explanation = str(data.get("explanation") or "").strip()
            if not code:
                if pre_explanation:
                    return {"reply": pre_explanation, "model": model}
                errors.append(f"{model}: kod üretilmedi")
                break
            try:
                out = run_sandboxed(code, df)
            except SandboxError as exc:
                last_error = str(exc)
                messages.append({"role": "assistant", "content": content})
                messages.append({"role": "user", "content": f"Kod şu hatayı verdi: {last_error}. Sütun adlarını birebir kullanarak düzeltilmiş JSON döndür."})
                continue
            result = out["result"]
            # explanation grounded on the executed result (this model first, then the other one)
            order = [model] + [m for m in chain if m != model]
            explanation = _explain_with_llm(client, order, message, result, title, errors) or _auto_explain(result, title)
            payload = result_to_payload(result, out.get("chart"), explanation, title)
            if title:
                payload["title"] = title
            payload["code"] = code
            payload["model"] = model
            return payload
        if last_error:
            errors.append(f"{model}: kod çalıştırılamadı ({last_error})")

    return {"_fallback": True, "_errors": errors}


def answer(message: str, history: list[dict], df: pd.DataFrame) -> dict:
    llm = llm_answer(message, history, df)
    if llm and not llm.get("_fallback"):
        llm["engine"] = "llm"
        return llm
    rb = rule_based_answer(message, df)
    rb["engine"] = "rules"
    rb["model"] = None
    if llm and llm.get("_fallback"):
        rb["llmErrors"] = llm.get("_errors", [])
        rb["note"] = "Yapay zekâ modeli yanıt veremedi; kural tabanlı analiz kullanıldı."
    return rb
