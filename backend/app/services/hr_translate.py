"""Turkish translation of the default IBM HR attrition dataset.

``build_turkish_dataset`` reads ``data/hr_attrition.csv``, renames columns,
translates categorical values, drops constant columns and writes the result to
``data/hr_personel_tr.csv`` (UTF-8 with BOM so Excel opens it correctly)."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

COLUMN_MAP: dict[str, str] = {
    "EmployeeNumber": "Personel No",
    "Age": "Yaş",
    "Attrition": "Ayrılma",
    "BusinessTravel": "İş Seyahati",
    "DailyRate": "Günlük Ücret",
    "Department": "Departman",
    "DistanceFromHome": "Eve Uzaklık (km)",
    "Education": "Eğitim Seviyesi",
    "EducationField": "Eğitim Alanı",
    "EnvironmentSatisfaction": "Ortam Memnuniyeti",
    "Gender": "Cinsiyet",
    "HourlyRate": "Saatlik Ücret",
    "JobInvolvement": "İşe Bağlılık",
    "JobLevel": "Kademe",
    "JobRole": "Pozisyon",
    "JobSatisfaction": "İş Memnuniyeti",
    "MaritalStatus": "Medeni Durum",
    "MonthlyIncome": "Aylık Gelir",
    "MonthlyRate": "Aylık Ücret",
    "NumCompaniesWorked": "Çalışılan Şirket Sayısı",
    "OverTime": "Fazla Mesai",
    "PercentSalaryHike": "Zam Oranı (%)",
    "PerformanceRating": "Performans Puanı",
    "RelationshipSatisfaction": "İlişki Memnuniyeti",
    "StockOptionLevel": "Hisse Opsiyonu",
    "TotalWorkingYears": "Toplam Deneyim (yıl)",
    "TrainingTimesLastYear": "Geçen Yıl Eğitim Sayısı",
    "WorkLifeBalance": "İş-Yaşam Dengesi",
    "YearsAtCompany": "Şirkette Yıl",
    "YearsInCurrentRole": "Pozisyonda Yıl",
    "YearsSinceLastPromotion": "Son Terfiden Bu Yana (yıl)",
    "YearsWithCurrManager": "Mevcut Yöneticiyle Yıl",
}

DROP_COLUMNS = ["EmployeeCount", "Over18", "StandardHours"]

# keyed by the *Turkish* column name
VALUE_MAP: dict[str, dict[str, str]] = {
    "Departman": {"Sales": "Satış", "Research & Development": "Ar-Ge", "Human Resources": "İnsan Kaynakları"},
    "Cinsiyet": {"Male": "Erkek", "Female": "Kadın"},
    "Ayrılma": {"Yes": "Evet", "No": "Hayır"},
    "Fazla Mesai": {"Yes": "Evet", "No": "Hayır"},
    "Medeni Durum": {"Single": "Bekar", "Married": "Evli", "Divorced": "Boşanmış"},
    "İş Seyahati": {"Travel_Rarely": "Nadiren", "Travel_Frequently": "Sık Sık", "Non-Travel": "Yok"},
    "Pozisyon": {
        "Sales Executive": "Satış Uzmanı",
        "Research Scientist": "Araştırma Bilimcisi",
        "Laboratory Technician": "Laboratuvar Teknisyeni",
        "Manufacturing Director": "Üretim Direktörü",
        "Healthcare Representative": "Sağlık Temsilcisi",
        "Manager": "Yönetici",
        "Sales Representative": "Satış Temsilcisi",
        "Research Director": "Araştırma Direktörü",
        "Human Resources": "İK Uzmanı",
    },
    "Eğitim Alanı": {
        "Life Sciences": "Yaşam Bilimleri",
        "Medical": "Tıp",
        "Marketing": "Pazarlama",
        "Technical Degree": "Teknik",
        "Human Resources": "İnsan Kaynakları",
        "Other": "Diğer",
    },
}

# Columns whose values are money (used for ₺ formatting in replies)
MONEY_COLUMNS = {"Aylık Gelir", "Günlük Ücret", "Saatlik Ücret", "Aylık Ücret", "MonthlyIncome", "DailyRate", "HourlyRate", "MonthlyRate"}


def translate_frame(df: pd.DataFrame) -> pd.DataFrame:
    out = df.drop(columns=[c for c in DROP_COLUMNS if c in df.columns]).rename(columns=COLUMN_MAP)
    for col, mapping in VALUE_MAP.items():
        if col in out.columns:
            out[col] = out[col].map(lambda v: mapping.get(str(v), v))
    # Personel No first, rest in original order
    if "Personel No" in out.columns:
        out = out[["Personel No"] + [c for c in out.columns if c != "Personel No"]]
    return out


def build_turkish_dataset(source: Path, target: Path) -> pd.DataFrame:
    df = translate_frame(pd.read_csv(source, encoding="utf-8-sig"))
    try:
        if not target.exists() or target.stat().st_mtime < source.stat().st_mtime or _header_differs(target, df):
            df.to_csv(target, index=False, encoding="utf-8-sig")
    except OSError:
        pass  # read-only filesystem: serve from memory
    return df


def _header_differs(target: Path, df: pd.DataFrame) -> bool:
    try:
        with target.open("r", encoding="utf-8-sig") as fh:
            header = fh.readline().rstrip("\r\n").split(",")
        return header != [str(c) for c in df.columns]
    except OSError:
        return True
