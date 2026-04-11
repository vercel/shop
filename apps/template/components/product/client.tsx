"use client";

import { Loader2, MinusIcon, PlusCircleIcon, PlusIcon, HandbagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { buyNowAction } from "@/components/cart/actions";
import { useCart } from "@/components/cart/context";
import { variantToOptimisticInfo } from "@/components/cart/optimistic-info";
import type { ProductDetails } from "@/lib/types";

import { Button } from "../ui/button";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

type AddToCartSectionProps = {
  product: ProductDetails;
};

export function AddToCartClient({ product }: AddToCartSectionProps) {
  const selectedVariant = product.variants[0];
  const selectedVariantId = selectedVariant?.id;

  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, startBuyNowTransition] = useTransition();
  const t = useTranslations("product");

  // Access cart context - addToCartOptimistic handles debouncing and server call
  const { addToCartOptimistic, pendingQuantity, isAddingToCart } = useCart();

  if (!selectedVariant) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">{t("selectVariant")}</p>
      </div>
    );
  }

  const isOutOfStock = !selectedVariant.availableForSale;

  const handleAddToCart = () => {
    if (selectedVariantId && selectedVariant) {
      addToCartOptimistic(
        selectedVariantId,
        quantity,
        variantToOptimisticInfo(selectedVariant, product),
      );
    }
  };

  const handleBuyNow = () => {
    if (!selectedVariantId) return;
    startBuyNowTransition(async () => {
      const { checkoutUrl } = await buyNowAction(selectedVariantId, quantity);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    });
  };

  const getButtonText = (): string => {
    if (isOutOfStock) return t("outOfStock");
    if (pendingQuantity > 0) return `Adding ${pendingQuantity}...`;
    if (isAddingToCart) return t("addingToCart");
    return t("addToCart");
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground">Quantity:</span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            aria-label={t("decreaseQuantity")}
          >
            <MinusIcon className="size-3.5" />
          </Button>
          <NativeSelect
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="rounded-full bg-muted border-0 min-w-15 h-8"
            size="sm"
          >
            {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => (
              <NativeSelectOption key={num} value={num}>
                {num}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={() => setQuantity(Math.min(99, quantity + 1))}
            disabled={quantity >= 99}
            aria-label={t("increaseQuantity")}
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Add to Cart Buttons */}
      <div className="space-y-2">
        <Button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="w-full justify-between h-10"
        >
          {getButtonText()}
          <PlusCircleIcon className="size-4" />
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-between h-10"
          disabled={isOutOfStock || isBuyingNow}
          onClick={handleBuyNow}
        >
          {isBuyingNow ? (
            <>
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t("buyNow")}
              </span>
              <span className="size-4" />
            </>
          ) : (
            <>
              {t("buyNow")}
              <HandbagIcon className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
