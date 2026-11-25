import { cn } from "@/lib/utils";

/** Hand-drawn monogram: a V whose right stroke carries a small bar-chart motif. */
export function Monogram({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" />
      <path d="M8 9.5 L14.6 23.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.6 23.5 L17.4 17.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19.2 20 V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 20 V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24.8 20 V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 22.5 H26" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sand-200">
      <Monogram />
      {!compact && (
        <div className="leading-none">
          <div className="font-serif text-[18px] font-medium tracking-[0.12em] text-sand-100">VESPERA</div>
          <div className="mt-1 text-[11px] text-ink-muted">Fabrika Zekâ Platformu</div>
        </div>
      )}
    </div>
  );
}
