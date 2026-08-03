import { ImageIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

export type MerchSlotVariant = "dark" | "light" | "paper";

interface MerchSlotProps extends React.ComponentProps<"div"> {
  label: string;
  variant?: MerchSlotVariant;
}

export function MerchSlot({ className, label, variant = "dark", ...props }: MerchSlotProps) {
  return (
    <div
      data-slot="merch-slot"
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 opacity-[0.07]",
          variant === "light" ? "bg-foreground" : "bg-background",
        )}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative flex flex-col items-center gap-2.5 px-5 text-center">
        <ImageIcon
          aria-hidden
          strokeWidth={1.25}
          className={cn(
            "size-8",
            variant === "paper" ? "text-layer-14-subtle" : "text-current opacity-60",
          )}
        />
        <span
          className={cn(
            "text-xxs font-semibold uppercase tracking-[0.2em]",
            variant === "paper" ? "text-layer-14-subtle" : "text-current opacity-60",
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
