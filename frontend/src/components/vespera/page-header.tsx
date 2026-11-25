import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<LucideProps>;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-4">
        {Icon && (
          <span className="mt-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-white/[0.04] text-sand-200 sm:flex">
            <Icon size={20} strokeWidth={1.5} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-[28px] font-medium leading-[1.15] text-sand-50 sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-[13.5px] text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
