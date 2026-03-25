"use client";

import { ArrowRightIcon, Loader2, ShoppingBagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { buyNowAction } from "@/components/cart/actions";
import { useCart } from "@/components/cart/context";
import { variantToOptimisticInfo } from "@/components/cart/optimistic-info";
import { Button } from "@/components/ui/button";
import type { Image, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MobileBuyButtons({
  selectedVariant,
  title,
  handle,
  featuredImage,
  availableForSale = true,
}: {
  selectedVariant: ProductVariant | undefined;
  title: string;
  handle: string;
  featuredImage: Image | null;
  availableForSale?: boolean;
}) {
  const selectedVariantId = selectedVariant?.id;

  const t = useTranslations("product");
  const [isBuyingNow, startBuyNowTransition] = useTransition();
  const { addToCartOptimistic, pendingQuantity, isAddingToCart } = useCart();

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
    startBuyNowTransition(async () => {
      const { checkoutUrl } = await buyNowAction(selectedVariantId, 1);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    });
  };

  if (!selectedVariant) {
    return null;
  }

  const isOutOfStock = !selectedVariant.availableForSale;

  // Button text logic
  const getButtonText = () => {
    if (pendingQuantity > 0) return t("addingQuantity", { quantity: String(pendingQuantity) });
    if (isAddingToCart) return t("addingToCart");
    if (isOutOfStock) return t("outOfStock");
    return t("addToCart");
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        className={cn("flex-1 justify-between h-11", !availableForSale && "invisible")}
        disabled={isOutOfStock || isBuyingNow}
        onClick={handleBuyNow}
      >
        {t("buyNow")}
        {isBuyingNow ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRightIcon className="size-4" />
        )}
      </Button>
      <Button
        type="button"
        disabled={isOutOfStock}
        onClick={handleAddToCart}
        className="flex-1 justify-between h-11 bg-foreground text-background hover:bg-foreground/90"
      >
        {getButtonText()}
        <ShoppingBagIcon className="size-4" />
      </Button>
    </div>
  );
}
