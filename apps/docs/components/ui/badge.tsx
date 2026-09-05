import { type ClassValue, clsx, cn } from "cn";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import type { VariantProps } from "@/lib/types";

const badgeStyles = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
    secondary: "border-transparent bg-gray-300 text-gray-1000 [a&]:hover:bg-gray-300/90",
    destructive:
      "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
    outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
  },
} as const;

type BadgeClassProps =
  | { class: ClassValue; className?: never }
  | { class?: never; className: ClassValue }
  | { class?: never; className?: never };

function badgeVariants(props?: (VariantProps<typeof badgeStyles> & BadgeClassProps) | null) {
  const { variant = "default" } = props ?? {};

  // Keep the public helper's classes unmerged; Badge applies cn after className.
  return clsx(
    "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
    variant !== null && badgeStyles.variant[variant],
    props?.class,
    props?.className,
  );
}

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeStyles> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : "span";

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
