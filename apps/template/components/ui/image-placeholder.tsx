import { ImageIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface ImagePlaceholderProps extends React.ComponentProps<"div"> {
  iconClassName?: string;
}

function ImagePlaceholder({ className, iconClassName, ...props }: ImagePlaceholderProps) {
  return (
    <div
      data-slot="image-placeholder"
      className={cn("flex items-center justify-center bg-white", className)}
      {...props}
    >
      <ImageIcon
        aria-hidden
        strokeWidth={1.5}
        className={cn("h-auto w-1/3 max-w-[10rem] text-muted-foreground/40", iconClassName)}
      />
    </div>
  );
}

export { ImagePlaceholder };
