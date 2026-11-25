"""SMTP sending with simulation fallback."""

from __future__ import annotations

import logging
import os
import smtplib
from datetime import datetime
from email.message import EmailMessage
from typing import Optional

log = logging.getLogger("vespera.email")
logging.basicConfig(level=logging.INFO)

SIMULATED_MESSAGE = "SMTP yapılandırılmadı, gönderim simüle edildi"


def smtp_config() -> Optional[dict]:
    server = os.getenv("SMTP_SERVER")
    user = os.getenv("SMTP_USER")
    if not server or not user:
        return None
    return {
        "server": server,
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": user,
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from": os.getenv("SMTP_FROM_EMAIL", user),
        "use_ssl": os.getenv("SMTP_USE_SSL", "false").lower() in ("1", "true", "yes"),
    }


def build_body(email: dict, reports: list[dict]) -> str:
    lines = [
        f"Konu: {email.get('subject', '')}",
        f"Zamanlama: {email.get('schedule', '-')}",
        "",
        "Ekli raporların özeti:",
    ]
    for r in reports:
        lines.append(f"• {r.get('name')} ({r.get('type', 'Rapor')})")
        if r.get("description"):
            lines.append(f"  {r['description']}")
        for c in r.get("components", []):
            if c.get("type") == "text" and c.get("content"):
                lines.append(f"  – {c['content'][:200]}")
    lines += ["", "Bu e-posta VESPERA Fabrika Zekâ Platformu tarafından oluşturuldu."]
    return "\n".join(lines)


def send_email(email: dict, reports: list[dict], to_addresses: list[str], attachment: Optional[bytes] = None) -> dict:
    cfg = smtp_config()
    body = build_body(email, reports)
    now = datetime.now()
    if not cfg:
        log.info("[SIMULATED EMAIL] to=%s subject=%s\n%s", to_addresses, email.get("subject"), body)
        return {"simulated": True, "message": SIMULATED_MESSAGE, "sentAt": now.isoformat(), "recipients": to_addresses}

    msg = EmailMessage()
    msg["Subject"] = email.get("subject", "VESPERA Raporu")
    msg["From"] = cfg["from"]
    msg["To"] = ", ".join(to_addresses)
    msg.set_content(body)
    if attachment:
        msg.add_attachment(attachment, maintype="application", subtype="pdf", filename="rapor.pdf")
    try:
        if cfg["use_ssl"]:
            with smtplib.SMTP_SSL(cfg["server"], cfg["port"], timeout=20) as s:
                s.login(cfg["user"], cfg["password"])
                s.send_message(msg)
        else:
            with smtplib.SMTP(cfg["server"], cfg["port"], timeout=20) as s:
                s.ehlo()
                try:
                    s.starttls()
                except smtplib.SMTPNotSupportedError:
                    pass
                s.login(cfg["user"], cfg["password"])
                s.send_message(msg)
    except Exception as exc:  # report but don't crash
        log.exception("SMTP gönderimi başarısız")
        return {"simulated": False, "sent": False, "error": str(exc), "message": f"SMTP hatası: {exc}", "sentAt": now.isoformat()}
    return {"simulated": False, "sent": True, "message": "E-posta gönderildi", "sentAt": now.isoformat(), "recipients": to_addresses}
