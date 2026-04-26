"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { useCart } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { buyNowAction } from "@/lib/cart/action";
import { variantToOptimisticInfo } from "@/lib/product";
import type { Image, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ShopLogo } from "./shop-logo";

export interface BuyButtonsLabels {
  addToCart: string;
  addingTemplate: string;
  addingToCart: string;
  buyWithShop: string;
  outOfStock: string;
}

export function BuyButtons({
  selectedVariant,
  title,
  handle,
  featuredImage,
  availableForSale = true,
  labels,
}: {
  selectedVariant: ProductVariant | undefined;
  title: string;
  handle: string;
  featuredImage: Image | null;
  availableForSale?: boolean;
  labels: BuyButtonsLabels;
}) {
  const selectedVariantId = selectedVariant?.id;

  const [, startBuyNowTransition] = useTransition();
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const { addToCartOptimistic, pendingQuantity, isAddingToCart } = useCart();

  // Reset pending state when returning from checkout (bfcache / back navigation)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsBuyingNow(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleAddToCart = () => {
    if (selectedVariantId && selectedVariant) {
      addToCartOptimistic(
        selectedVariantId,
        1,
        variantToOptimisticInfo(selectedVariant, {
          title,
          handle,
          featuredImage,
        }),
      );
    }
  };

  const handleBuyNow = () => {
    if (!selectedVariantId) return;
    setIsBuyingNow(true);
    startBuyNowTransition(async () => {
      try {
        const { checkoutUrl } = await buyNowAction(selectedVariantId, 1);
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          setIsBuyingNow(false);
        }
      } catch {
        setIsBuyingNow(false);
      }
    });
  };

  if (!selectedVariant) {
    return null;
  }

  const isOutOfStock = !selectedVariant.availableForSale;

  // Button text logic
  const getButtonText = () => {
    if (pendingQuantity > 0)
      return labels.addingTemplate.replace("{quantity}", String(pendingQuantity));
    if (isAddingToCart) return labels.addingToCart;
    if (isOutOfStock) return labels.outOfStock;
    return labels.addToCart;
  };

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg h-12 bg-shop text-white transition-all hover:bg-shop/85 disabled:pointer-events-none disabled:opacity-50",
          !availableForSale && "invisible",
        )}
        disabled={isOutOfStock || isBuyingNow}
        onClick={handleBuyNow}
      >
        {isBuyingNow ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <span className="text-sm font-medium">{labels.buyWithShop}</span>
            <ShopLogo className="h-4 w-auto" />
          </>
        )}
      </button>
      <Button
        type="button"
        disabled={isOutOfStock}
        onClick={handleAddToCart}
        className="flex-1 justify-center h-12 bg-foreground text-background hover:bg-foreground/90"
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
