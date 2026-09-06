import { cn } from "cn";
import type { ComponentProps } from "react";

export function Page({ children, className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("pt-10", className)} {...props}>
      {children}
    </div>
  );
}
