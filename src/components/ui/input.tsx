import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full min-w-0 rounded-md bg-cream px-3 text-sm text-ink shadow-(--shadow-border) outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-gold/60",
        className,
      )}
      {...props}
    />
  );
}
