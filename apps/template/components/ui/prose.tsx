import { cn } from "cn";
import type * as React from "react";

export function Prose({ className, ...props }: React.ComponentProps<"article">) {
  return (
    <article
      className={cn(
        "prose prose-neutral prose-headings:font-medium prose-headings:tracking-tight",
        className,
      )}
      {...props}
    />
  );
}
