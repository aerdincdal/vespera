"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { GlassCard } from "@/components/vespera/glass-card";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep a trace for developers without surfacing internals to the user.
    console.error("[VESPERA] sayfa hatası:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl pt-12 sm:pt-20">
      <GlassCard hover={false} className="text-center" as="section" aria-live="polite">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(217,184,106,0.35)] bg-[rgba(217,184,106,0.10)] text-warn">
          <AlertTriangle size={20} strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 font-serif text-[24px] font-medium text-sand-50">Bu ekran yüklenirken bir sorun oluştu</h1>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] text-ink-muted">
          Veri beklenmedik bir biçimde geldi ya da geçici bir bağlantı sorunu yaşandı. Yeniden denemek çoğu zaman yeterlidir.
        </p>
        {error.digest && <p className="tnum mt-3 text-[11px] text-sand-200/50">Hata kodu: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={reset} className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[13px]">
            <RotateCcw size={14} strokeWidth={2} /> Yeniden dene
          </button>
          <Link href="/dashboard" className="btn-glass inline-flex h-9 items-center px-3.5 text-[13px]">
            Genel Dashboard&apos;a dön
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
