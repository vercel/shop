import { BadgeCheckIcon } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface OfficialStoreBadgeProps extends ComponentPropsWithoutRef<"span"> {
  label?: string;
}

export function OfficialStoreBadge({
  label = "Official Store",
  className,
  ...props
}: OfficialStoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary",
        className,
      )}
      {...props}
    >
      <BadgeCheckIcon className="size-3" />
      {label}
    </span>
  );
}
