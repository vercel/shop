import { cn } from "@/lib/utils";
import type { ComponentPropsWithRef } from "react";

export function Container({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"section">) {
  return (
    <section className={cn("mx-auto px-4 py-8 lg:px-8", className)} {...props}>
      {children}
    </section>
  );
}
