import Image from "next/image";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface SwatchProps extends React.ComponentProps<"span"> {
  color?: string;
  image?: string;
  label: string;
  selected?: boolean;
}

export function Swatch({
  color,
  image,
  label,
  selected = false,
  className,
  ...props
}: SwatchProps) {
  return (
    <span
      data-slot="swatch"
      data-selected={selected}
      title={label}
      className={cn(
        "relative block size-9 shrink-0 overflow-hidden rounded-full transition-all",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:inset-ring after:inset-ring-foreground/10",
        "data-[selected=true]:ring-2 data-[selected=true]:ring-foreground data-[selected=true]:ring-offset-2 data-[selected=true]:ring-offset-background",
        className,
      )}
      {...props}
    >
      {image ? (
        <Image
          src={image}
          width={200}
          height={200}
          alt={label}
          className="size-full object-cover"
        />
      ) : (
        <span
          className="block size-full bg-accent"
          style={color ? { backgroundColor: color } : undefined}
        />
      )}
    </span>
  );
}
