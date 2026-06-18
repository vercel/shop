import Link from "next/link";
import type * as React from "react";

import { buildOptionUrl, type SelectedOptions } from "@/lib/product";
import type { ProductOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OptionPickerProps extends React.ComponentProps<"div"> {
  option: ProductOption;
  selectedValue: string;
  available: Set<string> | undefined;
  handle: string;
  selectedOptions: SelectedOptions;
}

export function OptionPicker({
  option,
  selectedValue,
  available,
  handle,
  selectedOptions,
  className,
  ...props
}: OptionPickerProps) {
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">{option.name}</p>
      <div className="flex flex-wrap gap-2">
        {option.values.map((value) => {
          const isSelected = selectedValue === value.name;

          const isAvailable = !available || available.has(value.name);

          const href = buildOptionUrl(handle, selectedOptions, option.name, value.name);

          const classes = cn(
            "grid px-5 py-2 text-center text-sm rounded-lg transition-all",
            isSelected
              ? "font-medium bg-primary text-primary-foreground"
              : "font-normal inset-ring inset-ring-foreground/15 text-foreground hover:inset-ring-foreground/35",
            !isAvailable && "opacity-40 cursor-not-allowed line-through",
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

          if (!isAvailable) {
            return (
              <span key={value.id} className={classes}>
                {label}
              </span>
            );
          }

          return (
            <Link key={value.id} href={href} scroll={false} className={classes}>
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
