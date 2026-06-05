import Link from "next/link";
import type * as React from "react";

import type { ProductOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OptionPickerProps extends React.ComponentProps<"div"> {
  option: ProductOption;
}

export function OptionPicker({ option, className, ...props }: OptionPickerProps) {
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">{option.name}</p>
      <div className="flex flex-wrap gap-2">
        {option.values.map((value) => {
          const isSelected = value.selected;

          const classes = cn(
            "grid px-5 py-2 text-center text-sm rounded-lg transition-all",
            isSelected
              ? "font-medium bg-primary text-primary-foreground"
              : "font-normal inset-ring inset-ring-foreground/15 text-foreground hover:inset-ring-foreground/35",
            !value.available && "opacity-40",
            !value.exists && "cursor-not-allowed line-through",
          );

          // Invisible medium-weight twin reserves the bold width so pills don't shift on selection.
          const label = (
            <>
              <span className="col-start-1 row-start-1">{value.name}</span>
              <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-medium">
                {value.name}
              </span>
            </>
          );

          if (!value.exists) {
            return (
              <span key={value.id} className={classes}>
                {label}
              </span>
            );
          }

          return (
            <Link
              key={value.id}
              href={value.href}
              scroll={false}
              className={cn(classes, "cursor-pointer")}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
