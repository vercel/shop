import Image from "next/image";
import Link from "next/link";
import type * as React from "react";

import type { ProductOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColorPickerProps extends React.ComponentProps<"div"> {
  option: ProductOption;
  hideImages?: boolean;
}

export function ColorPicker({ option, hideImages, className, ...props }: ColorPickerProps) {
  const selectedValue = option.values.find((value) => value.selected)?.name ?? "";

  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="grid grid-cols-4 lg:grid-cols-5 gap-2.5">
        {option.values.map((value) => {
          const isSelected = value.selected;
          const imageUrl = hideImages ? undefined : value.swatch?.image || value.image;

          const swatch = (
            <div
              className={cn(
                "relative aspect-square w-full rounded-lg transition-all overflow-hidden",
                "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:inset-ring after:inset-ring-foreground/10",
                isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  width={200}
                  height={200}
                  alt={`${value.name} swatch`}
                  className="size-full object-cover"
                />
              ) : (
                <div
                  className="size-full bg-accent"
                  style={value.swatch?.color ? { backgroundColor: value.swatch.color } : undefined}
                />
              )}
            </div>
          );

          if (!value.exists) {
            return (
              <span
                key={value.id}
                className="block opacity-40 cursor-not-allowed"
                aria-label={`${option.name}: ${value.name} (unavailable)`}
              >
                {swatch}
              </span>
            );
          }

          return (
            <Link
              key={value.id}
              href={value.href}
              prefetch={true}
              scroll={false}
              className={cn("block cursor-pointer", !value.available && "opacity-40")}
              aria-label={`Select ${option.name}: ${value.name}`}
            >
              {swatch}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
