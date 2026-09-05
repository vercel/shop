import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { clsx, cn, type ClassValue } from "cn";
import { isValidElement, type ReactElement } from "react";

import type { VariantProps } from "@/lib/variants";

const BADGE_STYLES = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
    destructive:
      "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20",
    outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
  },
};

function badgeVariants(
  props?:
    | (VariantProps<typeof BADGE_STYLES> & { class?: ClassValue; className?: ClassValue })
    | null,
) {
  const { class: classValue, className, variant = "default" } = props ?? {};
  return clsx(
    "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
    variant !== null && BADGE_STYLES.variant[variant],
    classValue,
    className,
  );
}

interface BadgeProps extends useRender.ComponentProps<"span">, VariantProps<typeof BADGE_STYLES> {
  /** @deprecated Pass `render={<El />}` instead. Kept for back-compat with Radix-era call sites. */
  asChild?: boolean;
}

function Badge({ asChild = false, className, render, variant, ...props }: BadgeProps) {
  const asChildRender =
    !render && asChild && isValidElement(props.children)
      ? (props.children as ReactElement)
      : undefined;

  return useRender({
    defaultTagName: "span",
    render: render ?? asChildRender,
    state: { slot: "badge" },
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      asChildRender ? { ...props, children: undefined } : props,
    ),
  });
}

export { Badge, badgeVariants };
