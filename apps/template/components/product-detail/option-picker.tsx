import { cn } from "cn";
import Link from "next/link";
import type * as React from "react";

import type { OptionGroupState } from "@/lib/product";

interface OptionPickerProps extends React.ComponentProps<"div"> {
  onSelectValue?: (optionName: string, value: string) => void;
  option: OptionGroupState;
}

export function OptionPicker({ onSelectValue, option, className, ...props }: OptionPickerProps) {
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">{option.name}</p>
      <div className="flex flex-wrap gap-2">
        {option.values.map((value) => {
          const classes = cn(
            "grid px-5 py-2 text-center text-sm rounded-lg transition-all border",
            !value.available
              ? "font-normal border-dashed border-border text-muted-foreground/50 line-through cursor-not-allowed"
              : value.selected
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

          if (!value.exists || !value.available) {
            return (
              <span key={value.name} className={classes}>
                {label}
              </span>
            );
          }

          return (
            <Link
              key={value.name}
              href={value.href}
              scroll={false}
              className={classes}
              aria-current={value.selected ? "true" : undefined}
              onClick={
                onSelectValue && !value.crossProduct
                  ? (event) => {
                      event.preventDefault();
                      onSelectValue(option.name, value.name);
                    }
                  : undefined
              }
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
