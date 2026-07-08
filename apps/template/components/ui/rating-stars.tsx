import { Star } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface RatingStarsProps extends React.ComponentProps<"div"> {
  /** Pre-formatted, already-localized review count text rendered beside the stars. */
  countLabel?: string;
  /** Accessible description of the rating, e.g. "Rated 4.5 out of 5". */
  label: string;
  max?: number;
  value: number;
}

export function RatingStars({
  className,
  countLabel,
  label,
  max = 5,
  value,
  ...props
}: RatingStarsProps) {
  const filledPercent = Math.min(Math.max(value / max, 0), 1) * 100;
  const stars = Array.from({ length: max }, (_, i) => i);

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      data-slot="rating-stars"
      {...props}
    >
      <div className="relative inline-flex" role="img" aria-label={label}>
        <div className="flex gap-0.5 text-muted-foreground/30" aria-hidden>
          {stars.map((i) => (
            <Star key={i} className="size-4" />
          ))}
        </div>
        <div
          className="absolute inset-0 flex gap-0.5 overflow-hidden text-star"
          style={{ width: `${filledPercent}%` }}
          aria-hidden
        >
          {stars.map((i) => (
            <Star key={i} className="size-4 shrink-0 fill-star" />
          ))}
        </div>
      </div>
      {countLabel ? <span className="text-foreground/50 text-sm">{countLabel}</span> : null}
    </div>
  );
}
