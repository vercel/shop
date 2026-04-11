"use client";

import { CheckIcon, LoaderCircleIcon, HandbagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCart } from "@/components/cart/context";
import type { OptimisticProductInfo } from "@/components/cart/optimistic-info";
import { cn } from "@/lib/utils";

type QuickAddState = "idle" | "adding" | "success";

interface ProductCardQuickAddProps {
  variantId: string;
  productInfo?: OptimisticProductInfo;
  className?: string;
}

export function ProductCardQuickAdd({
  variantId,
  productInfo,
  className,
}: ProductCardQuickAddProps) {
  const { addToCartOptimistic } = useCart();
  const t = useTranslations("product");
  const [state, setState] = useState<QuickAddState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (state !== "idle") return;

      setState("adding");
      void addToCartOptimistic(variantId, 1, productInfo).then((success) => {
        if (!success) {
          setState("idle");
          return;
        }

        setState("success");
        timeoutRef.current = setTimeout(() => {
          setState("idle");
        }, 1500);
      });
    },
    [variantId, addToCartOptimistic, productInfo, state],
  );

  return (
    <button
      type="button"
      data-slot="product-card-quick-add"
      onClick={handleClick}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      aria-label={t("addToCart")}
      className={cn(
        "absolute bottom-2 right-2 z-10",
        "flex items-center justify-center size-9 rounded-full",
        "bg-background/90 backdrop-blur-sm shadow-md border border-border/50",
        "opacity-0 translate-y-1",
        "[@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0",
        "transition-all duration-200 ease-out",
        "hover:bg-background hover:scale-110",
        "focus-visible:opacity-100 focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "cursor-pointer",
        className,
      )}
    >
      {state === "idle" && <HandbagIcon className="size-4" />}
      {state === "adding" && <LoaderCircleIcon className="size-4 animate-spin" />}
      {state === "success" && <CheckIcon className="size-4 text-positive" />}
    </button>
  );
}
