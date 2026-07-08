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
            "grid px-5 py-2 text-center text-sm rounded-lg transition-all border",
            !isAvailable
              ? "font-normal border-dashed border-border text-muted-foreground/50 line-through cursor-not-allowed"
              : isSelected
                ? "font-medium border-foreground text-foreground starting:border-border starting:text-muted-foreground"
                : "font-normal border-border text-muted-foreground hover:border-foreground hover:text-foreground",
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
