"""Render a report (list of components) to PDF with reportlab."""

from __future__ import annotations

import io
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.data import seed

_FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/DejaVuSans.ttf",
    "/Library/Fonts/DejaVuSans.ttf",
    os.path.expanduser("~/Library/Fonts/DejaVuSans.ttf"),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    # macOS fallbacks that also carry Turkish glyphs
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Verdana.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
]
_BOLD_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/DejaVuSans-Bold.ttf",
    "/Library/Fonts/DejaVuSans-Bold.ttf",
    os.path.expanduser("~/Library/Fonts/DejaVuSans-Bold.ttf"),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Verdana Bold.ttf",
]

_TRANSLIT = str.maketrans("çÇğĞıİöÖşŞüÜ", "cCgGiIoOsSuU")

FONT_NAME = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
_UNICODE_FONT = False
_HAS_LIRA = False  # whether the registered font has the ₺ (U+20BA) glyph


def _matplotlib_dejavu() -> Optional[str]:
    try:
        import matplotlib  # type: ignore

        p = Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans.ttf"
        return str(p) if p.exists() else None
    except Exception:
        return None


def _register_fonts() -> None:
    global FONT_NAME, FONT_BOLD, _UNICODE_FONT, _HAS_LIRA
    regular = next((p for p in _FONT_CANDIDATES if os.path.exists(p)), None) or _matplotlib_dejavu()
    if not regular:
        return
    bold = next((p for p in _BOLD_CANDIDATES if os.path.exists(p)), None) or regular
    try:
        reg_font = TTFont("VesperaSans", regular)
        pdfmetrics.registerFont(reg_font)
        pdfmetrics.registerFont(TTFont("VesperaSans-Bold", bold))
        try:
            _HAS_LIRA = ord("₺") in reg_font.face.charToGlyph
        except Exception:
            _HAS_LIRA = False
        pdfmetrics.registerFontFamily("VesperaSans", normal="VesperaSans", bold="VesperaSans-Bold", italic="VesperaSans", boldItalic="VesperaSans-Bold")
        FONT_NAME, FONT_BOLD, _UNICODE_FONT = "VesperaSans", "VesperaSans-Bold", True
    except Exception:
        FONT_NAME, FONT_BOLD, _UNICODE_FONT = "Helvetica", "Helvetica-Bold", False


_register_fonts()


def font_info() -> dict:
    return {"font": FONT_NAME, "unicode": _UNICODE_FONT, "liraGlyph": _HAS_LIRA}


def _t(text: object) -> str:
    """Make text safe for the active font (transliterate when no unicode font)."""
    s = "" if text is None else str(text)
    if not _UNICODE_FONT:
        s = s.translate(_TRANSLIT).replace("–", "-").replace("—", "-")
    if not _HAS_LIRA:
        s = s.replace("₺", "TL ")
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


NAVY = colors.HexColor("#0b1528")
NAVY_700 = colors.HexColor("#172b4d")
SAND = colors.HexColor("#c4b28d")
SAND_DARK = colors.HexColor("#8b7a55")
STEEL = colors.HexColor("#7f9fcf")
COPPER = colors.HexColor("#c8875a")
TEXT = colors.HexColor("#1f2937")
MUTED = colors.HexColor("#6b7280")
ROW_ALT = colors.HexColor("#f6f1e7")


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("VTitle", parent=base["Title"], fontName=FONT_BOLD, fontSize=22, leading=28, textColor=NAVY, alignment=TA_LEFT, spaceAfter=4),
        "meta": ParagraphStyle("VMeta", parent=base["Normal"], fontName=FONT_NAME, fontSize=9, textColor=MUTED, spaceAfter=14),
        "h2": ParagraphStyle("VH2", parent=base["Heading2"], fontName=FONT_BOLD, fontSize=13, leading=17, textColor=NAVY_700, spaceBefore=12, spaceAfter=6),
        "body": ParagraphStyle("VBody", parent=base["Normal"], fontName=FONT_NAME, fontSize=10.5, leading=15, textColor=TEXT, spaceAfter=8),
        "cell": ParagraphStyle("VCell", parent=base["Normal"], fontName=FONT_NAME, fontSize=9.5, leading=12, textColor=TEXT),
        "cellHead": ParagraphStyle("VCellHead", parent=base["Normal"], fontName=FONT_BOLD, fontSize=9, leading=12, textColor=colors.white),
        "footer": ParagraphStyle("VFooter", parent=base["Normal"], fontName=FONT_NAME, fontSize=8, textColor=MUTED),
    }


def _table_flowable(columns: list[dict], rows: list[dict], st: dict, width: float) -> Table:
    head = [Paragraph(_t(c["label"]), st["cellHead"]) for c in columns]
    body = [[Paragraph(_t(r.get(c["key"], "")), st["cell"]) for c in columns] for r in rows]
    col_w = width / max(len(columns), 1)
    tbl = Table([head] + body, colWidths=[col_w] * len(columns), repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY_700),
        ("LINEBELOW", (0, 0), (-1, 0), 1, SAND),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor("#e5e1d6")),
    ]
    for i in range(1, len(body) + 1):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), ROW_ALT))
    for ci, c in enumerate(columns):
        if c.get("align") == "right":
            style.append(("ALIGN", (ci, 0), (ci, -1), "RIGHT"))
    tbl.setStyle(TableStyle(style))
    return tbl


def _bar_chart(chart: dict, title: str, width: float) -> Drawing:
    data = chart.get("data", [])
    x_key = chart.get("xKey")
    y_keys = chart.get("yKeys") or []
    if not data or not x_key or not y_keys:
        d = Drawing(width, 40)
        d.add(String(0, 15, _t("Grafik verisi yok"), fontName=FONT_NAME, fontSize=10, fillColor=MUTED))
        return d

    h = 190
    d = Drawing(width, h)
    bc = VerticalBarChart()
    bc.x = 40
    bc.y = 30
    bc.height = h - 60
    bc.width = width - 60
    bc.data = [[float(row.get(k, 0) or 0) for row in data] for k in y_keys]
    bc.categoryAxis.categoryNames = [_t(row.get(x_key, "")) for row in data]
    bc.categoryAxis.labels.fontName = FONT_NAME
    bc.categoryAxis.labels.fontSize = 8
    bc.categoryAxis.labels.angle = 0
    bc.categoryAxis.strokeColor = SAND_DARK
    bc.valueAxis.labels.fontName = FONT_NAME
    bc.valueAxis.labels.fontSize = 8
    bc.valueAxis.strokeColor = SAND_DARK
    bc.valueAxis.gridStrokeColor = colors.HexColor("#e5e1d6")
    bc.valueAxis.visibleGrid = True
    bc.valueAxis.valueMin = 0
    bc.groupSpacing = 8
    bc.barSpacing = 2
    bc.strokeColor = None
    palette = [SAND, STEEL, COPPER, colors.HexColor("#8fa98a"), colors.HexColor("#b8707a"), colors.HexColor("#9b8fbf")]
    for i in range(len(y_keys)):
        bc.bars[i].fillColor = palette[i % len(palette)]
        bc.bars[i].strokeColor = None
    d.add(bc)
    d.add(String(40, h - 18, _t(title), fontName=FONT_BOLD, fontSize=10, fillColor=NAVY_700))
    legend = " · ".join(_t(k) for k in y_keys)
    d.add(String(40, 6, legend, fontName=FONT_NAME, fontSize=8, fillColor=MUTED))
    return d


def _resolve_chart(component: dict) -> tuple[dict, str]:
    if component.get("data"):
        return {"data": component["data"], "xKey": component.get("xKey"), "yKeys": component.get("yKeys")}, component.get("label", "Grafik")
    src = component.get("source", "aylik-satis")
    chart = seed.REPORT_CHART_DATA.get(src) or seed.REPORT_CHART_DATA["aylik-satis"]
    name = next((o["name"] for o in seed.REPORT_CHART_OPTIONS if o["id"] == src), component.get("label", "Grafik"))
    return chart, name


def _resolve_table(component: dict) -> tuple[list[dict], list[dict], str]:
    if component.get("columns") and component.get("rows") is not None:
        return component["columns"], component["rows"], component.get("label", "Tablo")
    src = component.get("source", "kategori")
    tbl = seed.REPORT_TABLE_DATA.get(src) or seed.REPORT_TABLE_DATA["kategori"]
    name = next((o["name"] for o in seed.REPORT_TABLE_OPTIONS if o["id"] == src), component.get("label", "Tablo"))
    return tbl["columns"], tbl["rows"], name


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT_NAME, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 12 * mm, _t("VESPERA · Fabrika Zekâ Platformu"))
    canvas.drawRightString(A4[0] - doc.rightMargin, 12 * mm, _t(f"Sayfa {doc.page}"))
    canvas.setStrokeColor(SAND)
    canvas.setLineWidth(0.6)
    canvas.line(doc.leftMargin, 16 * mm, A4[0] - doc.rightMargin, 16 * mm)
    canvas.restoreState()


def render_report_pdf(report: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=24 * mm,
        title=report.get("name", "Rapor"),
        author="VESPERA",
    )
    st = _styles()
    width = A4[0] - doc.leftMargin - doc.rightMargin
    story = []

    components = report.get("components") or []
    has_title = any(c.get("type") == "title" for c in components)
    if not has_title:
        story.append(Paragraph(_t(report.get("name", "Rapor")), st["title"]))

    meta = f"{report.get('type', 'Rapor')} · {datetime.now().strftime('%d.%m.%Y %H:%M')}"
    if report.get("description"):
        meta = f"{report['description']} · {meta}"

    first_title_done = False
    for comp in components:
        ctype = comp.get("type")
        if ctype == "title":
            story.append(Paragraph(_t(comp.get("content") or report.get("name", "")), st["title"]))
            if not first_title_done:
                story.append(Paragraph(_t(meta), st["meta"]))
                first_title_done = True
        elif ctype == "text":
            if comp.get("label"):
                story.append(Paragraph(_t(comp["label"]), st["h2"]))
            story.append(Paragraph(_t(comp.get("content", "")), st["body"]))
        elif ctype == "chart":
            chart, name = _resolve_chart(comp)
            story.append(Paragraph(_t(comp.get("label") or name), st["h2"]))
            story.append(_bar_chart(chart, name, width))
            story.append(Spacer(1, 8))
        elif ctype == "table":
            columns, rows, name = _resolve_table(comp)
            story.append(Paragraph(_t(comp.get("label") or name), st["h2"]))
            story.append(_table_flowable(columns, rows, st, width))
            story.append(Spacer(1, 8))
        elif ctype == "image":
            story.append(Paragraph(_t(comp.get("label", "Görsel")), st["h2"]))
            story.append(Paragraph(_t("[Görsel yer tutucu]"), st["body"]))
    if not has_title:
        story.insert(1, Paragraph(_t(meta), st["meta"]))

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()
