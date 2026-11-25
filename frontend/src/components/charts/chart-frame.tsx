import { cn } from "@/lib/utils";

/** Wraps a chart with a caption row and a fixed height so ResponsiveContainer can measure. */
export function ChartFrame({
  title,
  caption,
  legend,
  height = 280,
  className,
  children,
}: {
  title?: string;
  caption?: string;
  legend?: React.ReactNode;
  height?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={cn("m-0", className)}>
      {(title || legend) && (
        <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && <div className="text-[13px] font-semibold text-sand-100">{title}</div>}
            {caption && <div className="text-[11.5px] text-ink-muted">{caption}</div>}
          </div>
          {legend}
        </figcaption>
      )}
      <div style={{ height }} className="w-full [&_.recharts-responsive-container]:!h-full">
        {children}
      </div>
    </figure>
  );
}
