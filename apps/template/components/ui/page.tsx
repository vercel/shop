import type * as React from "react";

import { cn } from "@/lib/utils";

export function Page({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("pt-10", className)} {...props}>
      {children}
    </div>
  );
}
