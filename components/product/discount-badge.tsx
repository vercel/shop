import { cn } from "cn";
import type { ComponentProps } from "react";

interface DiscountBadgeProps extends ComponentProps<"span"> {
  percent: number;
}

export function DiscountBadge({ percent, className, ...props }: DiscountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-medium tabular-nums bg-positive/15 text-positive",
        className,
      )}
      {...props}
    >
      {percent}% OFF
    </span>
  );
}
