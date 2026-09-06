import { cn } from "cn";
import type { ComponentProps } from "react";

export function Prose({ className, ...props }: ComponentProps<"article">) {
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
