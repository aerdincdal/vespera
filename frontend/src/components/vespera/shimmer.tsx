import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("vs-shimmer", className)} aria-hidden />;
}

export function KpiSkeleton() {
  return (
    <div className="glass rounded-[20px] p-6 pl-7">
      <Shimmer className="h-3 w-28" />
      <Shimmer className="mt-5 h-8 w-32" />
      <Shimmer className="mt-3 h-3 w-40" />
    </div>
  );
}

export function CardSkeleton({ lines = 5, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("glass rounded-[20px] p-6", className)}>
      <Shimmer className="h-4 w-44" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} className="h-3" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton({ kpis = 4 }: { kpis?: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: kpis }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <CardSkeleton className="lg:col-span-8" lines={7} />
        <CardSkeleton className="lg:col-span-4" lines={4} />
      </div>
    </div>
  );
}
