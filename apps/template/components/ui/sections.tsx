import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils";

export function Sections({ children, className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div className={cn("grid gap-10", className)} {...props}>
      {children}
    </div>
  );
}
