import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { clsx, cn, type ClassValue } from "cn";
import { isValidElement, type ReactElement } from "react";

import type { VariantProps } from "@/lib/variants";

const BUTTON_STYLES = {
  size: {
    default: "h-9 px-5 py-2 has-[>svg]:px-2.5",
    icon: "size-9",
    "icon-lg": "size-10",
    "icon-sm": "size-8",
    lg: "h-10 px-5 has-[>svg]:px-5",
    sm: "h-8 gap-1.5 px-2.5 has-[>svg]:px-2.5",
  },
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive:
      "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  },
};

function buttonVariants(
  props?:
    | (VariantProps<typeof BUTTON_STYLES> & { class?: ClassValue; className?: ClassValue })
    | null,
) {
  const { class: classValue, className, size = "default", variant = "default" } = props ?? {};
  return clsx(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
    variant !== null && BUTTON_STYLES.variant[variant],
    size !== null && BUTTON_STYLES.size[size],
    classValue,
    className,
  );
}

interface ButtonProps
  extends useRender.ComponentProps<"button">, VariantProps<typeof BUTTON_STYLES> {
  /** @deprecated Pass `render={<El />}` instead. Kept for back-compat with Radix-era call sites. */
  asChild?: boolean;
}

function Button({ asChild = false, className, render, size, variant, ...props }: ButtonProps) {
  const asChildRender =
    !render && asChild && isValidElement(props.children)
      ? (props.children as ReactElement)
      : undefined;

  return useRender({
    defaultTagName: "button",
    render: render ?? asChildRender,
    state: { slot: "button" },
    props: mergeProps<"button">(
      {
        className: cn(buttonVariants({ className, size, variant })),
      },
      asChildRender ? { ...props, children: undefined } : props,
    ),
  });
}

export { Button, buttonVariants };
