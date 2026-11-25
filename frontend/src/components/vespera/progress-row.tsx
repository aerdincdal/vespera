import { cn } from "@/lib/utils";
import { toneColor } from "./tone";

export function ProgressRow({
  label,
  value,
  color,
  index = 0,
  suffix = "%",
  className,
  onClick,
}: {
  label: string;
  value: number;
  color?: string;
  index?: number;
  suffix?: string;
  className?: string;
  onClick?: () => void;
}) {
  const c = toneColor(color, index);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("group flex w-full items-center gap-4 py-2.5 text-left", onClick && "-mx-2 rounded-xl px-2 transition-colors hover:bg-[rgba(196,178,141,0.05)]", className)}
    >
      <span className="w-[42%] min-w-0 truncate text-[13px] text-sand-100/85 sm:w-1/3">{label}</span>
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: c, boxShadow: `0 0 12px -2px ${c}` }}
        />
      </div>
      <span className="tnum w-12 text-right text-[13px] font-medium text-sand-50">
        {value}
        {suffix}
      </span>
    </Tag>
  );
}
