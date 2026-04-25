import type * as React from "react";

import { cn } from "@/lib/utils";

interface AboutItemProps extends React.ComponentProps<"div"> {
  descriptionHtml: string;
}

export function AboutItem({ descriptionHtml, className, ...props }: AboutItemProps) {
  if (!descriptionHtml) return null;

  return (
    <div
      className={cn("prose prose-sm text-foreground", className)}
      dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      {...props}
    />
  );
}
