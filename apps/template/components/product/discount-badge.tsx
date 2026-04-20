import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

interface DiscountBadgeProps extends ComponentPropsWithoutRef<"span"> {
  percent: number;
  variant?: "green" | "blue";
}

export function DiscountBadge({
  percent,
  variant = "green",
  className,
  ...props
}: DiscountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        variant === "green" && "bg-positive/15 text-positive",
        variant === "blue" && "bg-blue-500/15 text-blue-600",
        className,
      )}
      {...props}
    >
      {percent}% OFF
    </span>
  );
}
