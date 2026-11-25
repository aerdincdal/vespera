import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = React.ComponentProps<typeof Button>;

export function PrimaryButton({ className, ...props }: Props) {
  return <Button variant="default" className={cn("btn-primary h-9 px-4 text-[13px]", className)} {...props} />;
}

export function GlassButton({ className, ...props }: Props) {
  return <Button variant="ghost" className={cn("btn-glass h-9 px-3.5 text-[13px]", className)} {...props} />;
}

export function IconButton({ className, ...props }: Props) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn("rounded-lg text-sand-200/80 hover:bg-white/[0.06] hover:text-sand-50 max-sm:size-9", className)}
      {...props}
    />
  );
}
