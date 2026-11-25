import { cn } from "@/lib/utils";

type Variant = "ok" | "err" | "warn" | "info" | "sand" | "muted" | "copper" | "lavender";

const MAP: Record<string, Variant> = {
  "çalışıyor": "ok", "aktif": "ok", "tamamlandı": "ok", "bağlı": "ok", "yeterli": "ok", "yüksek": "ok", "düşük-oncelik": "muted",
  "durdu": "err", "kritik": "err", "bağlantı yok": "err", "hata": "err",
  "bakımda": "warn", "planlandı": "info", "orta": "warn", "düşük": "copper",
  "pasif": "muted", "beklemede": "info",
  "admin": "err", "yönetici": "info", "analist": "sand", "gözlemci": "muted",
  "—": "muted",
};

const CLASSES: Record<Variant, string> = {
  ok: "border-[rgba(127,178,138,0.35)] bg-[rgba(127,178,138,0.10)] text-ok",
  err: "border-[rgba(201,107,107,0.35)] bg-[rgba(201,107,107,0.10)] text-err",
  warn: "border-[rgba(217,184,106,0.35)] bg-[rgba(217,184,106,0.10)] text-warn",
  info: "border-[rgba(127,159,207,0.35)] bg-[rgba(127,159,207,0.10)] text-info",
  sand: "border-[rgba(196,178,141,0.35)] bg-[rgba(196,178,141,0.10)] text-sand-200",
  copper: "border-[rgba(200,135,90,0.35)] bg-[rgba(200,135,90,0.10)] text-copper",
  lavender: "border-[rgba(155,143,191,0.35)] bg-[rgba(155,143,191,0.10)] text-lavender",
  muted: "border-line bg-white/[0.03] text-sand-200/70",
};

/** Performance "Yüksek/Orta/Düşük" and priority share labels; `context` disambiguates. */
export function statusVariant(status: string, context?: "priority" | "performance" | "role"): Variant {
  const s = status.trim().toLowerCase();
  if (context === "priority") {
    if (s === "yüksek") return "err";
    if (s === "orta") return "warn";
    if (s === "düşük") return "muted";
  }
  return MAP[s] ?? "sand";
}

export function StatusBadge({
  status,
  context,
  className,
  dot = true,
}: {
  status: string;
  context?: "priority" | "performance" | "role";
  className?: string;
  dot?: boolean;
}) {
  const v = statusVariant(status, context);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium",
        CLASSES[v],
        className,
      )}
    >
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {status}
    </span>
  );
}

export const STATUS_WORDS = new Set(Object.keys(MAP));
