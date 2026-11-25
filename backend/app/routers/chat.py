from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.data import seed
from app.services import chat_service
from app.services import datasource_service as dss
from app.store import store

router = APIRouter(tags=["chat"])


class HistoryItem(BaseModel):
    role: str
    content: str


class ChatBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[HistoryItem] = []
    datasourceId: Optional[str] = None


@router.get("/chat/welcome")
def welcome():
    has_key = bool(os.getenv("OPENAI_API_KEY"))
    df = dss.default_dataframe()
    return {
        "message": seed.CHAT_WELCOME,
        "engine": "llm" if has_key else "rules",
        "model": os.getenv("OPENAI_MODEL", "gpt-4o") if has_key else None,
        "fallbackModel": os.getenv("OPENAI_MODEL_FALLBACK") or None,
        "defaultDataset": dss.DEFAULT_NAME,
        "defaultDatasetUrl": "/api/datasources/default/csv",
        "rows": int(len(df)),
        "columns": [str(c) for c in df.columns],
        "suggestions": [
            "Departmanlara göre ortalama maaşları göster",
            "Yaş dağılımı histogramını çiz",
            "En yüksek maaşı alan 5 kişiyi listele",
            "Departmanlara göre ayrılma oranı nedir?",
            "Fazla mesai yapanların ortalama iş memnuniyeti",
            "Yaşı 40'tan büyük kadın çalışanların ortalama geliri",
            "Aylık gelir ile toplam deneyim arasındaki ilişki",
            "Pozisyonlara göre çalışan sayısı",
            "Medeni duruma göre ayrılma yüzdesi",
            "Verideki sütunlar neler?",
        ],
    }


@router.post("/chat")
def chat(body: ChatBody):
    if body.datasourceId and body.datasourceId != "default":
        df = store.dataframes.get(body.datasourceId)
        if df is None:
            raise HTTPException(status_code=404, detail="Seçilen veri kaynağı için yüklenmiş veri bulunamadı")
        source = body.datasourceId
    else:
        df = dss.default_dataframe()
        source = "default"
    try:
        result = chat_service.answer(body.message, [h.model_dump() for h in body.history], df)
    except Exception as exc:  # never 500 the chat UI
        result = {"reply": f"Analiz sırasında bir hata oluştu: {exc}", "engine": "error", "model": None}
    result.setdefault("engine", "rules")
    result.setdefault("model", None)
    result["datasourceId"] = source
    return result
