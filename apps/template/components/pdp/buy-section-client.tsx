"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, use, useState, useTransition } from "react";

import { buyNowAction } from "@/lib/cart/action";
import { useCart } from "@/components/cart/context";
import { variantToOptimisticInfo } from "@/lib/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails, ProductVariant } from "@/lib/types";

import { QuantitySelector } from "./quantity-selector";
import { ShopLogo } from "./shop-logo";
import { type SelectedOptions, resolveSelectedVariant } from "@/lib/product";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function Content({
  productPromise,
  selectedOptions,
}: {
  productPromise: Promise<ProductDetails>;
  selectedOptions: SelectedOptions;
}) {
  const product = use(productPromise);
  const selectedVariant = resolveSelectedVariant(product.variants, selectedOptions);
  const selectedVariantId = selectedVariant?.id;

  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, startBuyNowTransition] = useTransition();
  const t = useTranslations("product");

  const { addToCartOptimistic, pendingQuantity, isAddingToCart } = useCart();

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
    <div className="space-y-6">
      <Card className="backdrop-blur bg-card/90 border-border/90 shadow-[0_0_0_2px_rgba(90,90,90,0.05)] overflow-hidden py-0">
        <CardContent className="pt-6 pb-4 space-y-6">
          {/* Stock Status */}
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">
              {isOutOfStock ? t("outOfStock") : t("inStock")}
            </h3>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} />}

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg h-12 bg-shop text-white transition-all hover:bg-shop/85 disabled:pointer-events-none disabled:opacity-50"
                disabled={isOutOfStock || isBuyingNow}
                onClick={handleBuyNow}
              >
                {isBuyingNow ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <span className="text-sm font-medium">{t("buyWithShop")}</span>
                    <ShopLogo className="h-[18px] w-auto" />
                  </>
                )}
              </button>
              <Button
                type="button"
                variant="secondary"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="w-full justify-center h-12"
              >
                {getButtonText()}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function BuySectionClient({
  productPromise,
  selectedOptions,
}: {
  productPromise: Promise<ProductDetails>;
  selectedOptions: SelectedOptions;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Content productPromise={productPromise} selectedOptions={selectedOptions} />
    </Suspense>
  );
}
