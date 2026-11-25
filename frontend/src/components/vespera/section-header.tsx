import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  as: Tag = "h2",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3", className)}>
      <div className="min-w-0">
        <Tag className="font-serif text-[17px] font-medium text-sand-50">{title}</Tag>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
