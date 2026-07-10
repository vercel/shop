"use client";

import { useTranslations } from "next-intl";

import { useCart } from "@/components/cart/context";
import { ShopPayButton } from "@/components/shop-pay/shop-pay-button";
import { Button } from "@/components/ui/button";
import { variantToOptimisticInfo } from "@/lib/product";
import type { Image, Money, SelectedOption } from "@/lib/types";
import { cn } from "@/lib/utils";

// Client-facing projection of the selected variant — only the fields the buy
// controls need. Bundle relationship arrays stay on the server; the gating they
// imply is collapsed to the requiresBundleConfiguration boolean.
export interface BuyButtonVariant {
  availableForSale: boolean;
  id: string;
  image: Image | null;
  price: Money;
  requiresBundleConfiguration: boolean;
  selectedOptions: SelectedOption[];
  title: string;
}

export function BuyButtons({
  selectedVariant,
  title,
  handle,
  featuredImage,
  availableForSale = true,
  checkoutOrigin,
}: {
  selectedVariant: BuyButtonVariant | undefined;
  title: string;
  handle: string;
  featuredImage: Image | null;
  availableForSale?: boolean;
  checkoutOrigin: string;
}) {
  const selectedVariantId = selectedVariant?.id;

  const t = useTranslations("product");
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

  if (!selectedVariant) {
    return null;
  }

  const requiresBundleConfiguration = selectedVariant.requiresBundleConfiguration;
  const isOutOfStock = !selectedVariant.availableForSale;

  const getButtonText = () => {
    if (pendingQuantity > 0) return t("addingQuantity", { quantity: String(pendingQuantity) });
    if (isAddingToCart) return t("addingToCart");
    if (requiresBundleConfiguration) return t("bundleConfigurationRequired");
    if (isOutOfStock) return t("outOfStock");
    return t("addToCart");
  };

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className={cn(!availableForSale && "invisible")}>
        {selectedVariantId ? (
          <ShopPayButton
            checkoutUrl={checkoutOrigin}
            variants={[{ id: selectedVariantId, quantity: 1 }]}
            channel="hydrogen"
            disabled={isOutOfStock || requiresBundleConfiguration}
            width="100%"
            borderRadius="8px"
          />
        ) : null}
      </div>
      <Button
        type="button"
        disabled={isOutOfStock || requiresBundleConfiguration}
        onClick={handleAddToCart}
        className="flex-1 justify-center h-12"
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
