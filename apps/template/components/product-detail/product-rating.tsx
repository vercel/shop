import { Star } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface ProductRatingProps extends React.ComponentProps<"div"> {
  rating?: number | null;
  count?: number | null;
  ariaLabel?: string;
  locale?: string;
}

const STAR_COUNT = 5;

export function ProductRating({
  rating,
  count,
  ariaLabel,
  locale,
  className,
  ...props
}: ProductRatingProps) {
  const hasRating = typeof rating === "number" && Number.isFinite(rating);
  const clamped = hasRating ? Math.max(0, Math.min(STAR_COUNT, rating)) : 0;
  const fillPercent = (clamped / STAR_COUNT) * 100;

  const formattedCount =
    typeof count === "number" && Number.isFinite(count)
      ? new Intl.NumberFormat(locale).format(Math.max(0, Math.round(count)))
      : null;

  return (
    <div
      data-slot="product-rating"
      className={cn("flex items-center gap-1.5 leading-none", className)}
      aria-label={hasRating ? ariaLabel : undefined}
      aria-hidden={!hasRating || undefined}
      {...props}
    >
      <span className="relative inline-flex">
        <span className="flex text-foreground/15" aria-hidden>
          {Array.from({ length: STAR_COUNT }).map((_, i) => (
            <Star key={i} className="size-4 fill-current" strokeWidth={0} />
          ))}
        </span>
        <span
          className="absolute inset-y-0 left-0 flex overflow-hidden text-yellow-500"
          style={{ width: `${fillPercent}%` }}
          aria-hidden
        >
          {Array.from({ length: STAR_COUNT }).map((_, i) => (
            <Star key={i} className="size-4 shrink-0 fill-current" strokeWidth={0} />
          ))}
        </span>
      </span>
      {formattedCount !== null && (
        <span className="text-xs text-muted-foreground tabular-nums">({formattedCount})</span>
      )}
    </div>
  );
}
