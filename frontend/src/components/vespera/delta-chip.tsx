import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { deltaSign } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Delta chip. `invert` = a decrease is good (e.g. downtime, cost). */
export function DeltaChip({ delta, invert = false, className }: { delta?: string; invert?: boolean; className?: string }) {
  if (!delta) return null;
  const sign = deltaSign(delta);
  const good = sign === 0 ? null : invert ? sign < 0 : sign > 0;
  const Icon = sign > 0 ? ArrowUpRight : sign < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium",
        good === null && "border-line text-sand-200",
        good === true && "border-[rgba(127,178,138,0.35)] bg-[rgba(127,178,138,0.10)] text-ok",
        good === false && "border-[rgba(201,107,107,0.35)] bg-[rgba(201,107,107,0.10)] text-err",
        className,
      )}
    >
      <Icon size={12} strokeWidth={1.75} />
      {delta}
    </span>
  );
}
