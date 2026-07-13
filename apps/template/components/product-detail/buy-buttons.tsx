"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { useCart } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { buyNowAction } from "@/lib/cart/action";
import { variantToOptimisticInfo } from "@/lib/product";
import type { Image, Money, SelectedOption } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ShopPayLogo } from "./shop-pay-logo";

// Keep bundle relationship arrays server-side; the client only needs their gating boolean.
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
}: {
  selectedVariant: BuyButtonVariant | undefined;
  title: string;
  handle: string;
  featuredImage: Image | null;
  availableForSale?: boolean;
}) {
  const selectedVariantId = selectedVariant?.id;

  const t = useTranslations("product");
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
      <button
        type="button"
        className={cn(
          "flex h-10.75 flex-1 cursor-pointer items-center justify-center rounded-lg bg-shop px-4 py-2.5 text-white transition-all hover:bg-shop/85 disabled:cursor-not-allowed disabled:opacity-50",
          !availableForSale && "invisible",
        )}
        disabled={isOutOfStock || isBuyingNow || requiresBundleConfiguration}
        onClick={handleBuyNow}
      >
        {isBuyingNow ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <span className="sr-only">{t("buyWithShop")} Shop Pay</span>
            <ShopPayLogo aria-hidden="true" className="h-auto w-22" />
          </>
        )}
      </button>
      <Button
        type="button"
        disabled={isOutOfStock || requiresBundleConfiguration}
        onClick={handleAddToCart}
        className="h-10.75 flex-1 justify-center"
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
