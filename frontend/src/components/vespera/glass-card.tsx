import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean;
  as?: "div" | "section" | "article" | "aside";
}

export function GlassCard({ className, hover = true, padded = true, as: Tag = "div", ...props }: GlassCardProps) {
  return (
    <Tag
      className={cn("glass rounded-[20px]", hover && "glass-hover", padded && "p-6", className)}
      {...props}
    />
  );
}
