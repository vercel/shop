"use client";

import { ArrowRightIcon, Loader2, ShoppingBagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, use, useState, useTransition } from "react";
import { buyNowAction } from "@/components/cart/actions";
import { useCart } from "@/components/cart/context";
import { variantToOptimisticInfo } from "@/components/cart/optimistic-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails } from "@/lib/types";
import { QuantitySelector } from "./quantity-selector";
import { usePdpVariantState } from "./variant-state";
import { resolveSelectedVariant } from "./variants";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

function Content({
  productPromise,
}: {
  productPromise: Promise<ProductDetails>;
}) {
  const product = use(productPromise);
  const { selectedOptions } = usePdpVariantState();
  const selectedVariant = resolveSelectedVariant(
    product.variants,
    selectedOptions,
  );
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
    if (pendingQuantity > 0)
      return t("addingQuantity", { quantity: String(pendingQuantity) });
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
          {!isOutOfStock && (
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Button
                type="button"
                className="w-full justify-between h-12"
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
                    <ArrowRightIcon className="size-4" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="w-full justify-between h-11"
              >
                {getButtonText()}
                <ShoppingBagIcon className="size-4" />
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
}: {
  productPromise: Promise<ProductDetails>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Content productPromise={productPromise} />
    </Suspense>
  );
}
