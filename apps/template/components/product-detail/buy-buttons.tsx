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

import { BuyWithShopLogo } from "./buy-with-shop-logo";

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
  availableForSale = true,
  buyWithShop = true,
  featuredImage,
  handle,
  selectedVariant,
  title,
}: {
  availableForSale?: boolean;
  buyWithShop?: boolean;
  featuredImage: Image | null;
  handle: string;
  selectedVariant: BuyButtonVariant | undefined;
  title: string;
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
    <div className="grid gap-2.5">
      <Button
        type="button"
        disabled={isOutOfStock || requiresBundleConfiguration}
        onClick={handleAddToCart}
        className="h-12 w-full justify-center"
      >
        {getButtonText()}
      </Button>
      {buyWithShop ? (
        <button
          type="button"
          className={cn(
            "flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-shop px-4 text-white transition-colors hover:bg-shop/85 disabled:cursor-not-allowed disabled:opacity-50",
            !availableForSale && "invisible",
          )}
          disabled={isOutOfStock || isBuyingNow || requiresBundleConfiguration}
          onClick={handleBuyNow}
        >
          {isBuyingNow ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <span className="sr-only">{t("buyWithShop")}</span>
              <BuyWithShopLogo aria-hidden="true" className="h-auto w-32.75" />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
