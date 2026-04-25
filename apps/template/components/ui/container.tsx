import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils";

export function Container({ children, className, ...props }: ComponentPropsWithRef<"section">) {
  return (
    <section className={cn("mx-auto w-full px-5 py-10 lg:px-10", className)} {...props}>
      {children}
    </section>
  );
}
