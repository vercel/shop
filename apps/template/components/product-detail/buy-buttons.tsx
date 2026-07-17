"use client";

import { Loader2, MinusIcon, PlusIcon } from "lucide-react";
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
  quantityPicker = true,
  selectedVariant,
  title,
}: {
  availableForSale?: boolean;
  buyWithShop?: boolean;
  featuredImage: Image | null;
  handle: string;
  quantityPicker?: boolean;
  selectedVariant: BuyButtonVariant | undefined;
  title: string;
}) {
  const selectedVariantId = selectedVariant?.id;

  const t = useTranslations("product");
  const tCart = useTranslations("cart");
  const [, startBuyNowTransition] = useTransition();
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [quantity, setQuantity] = useState(1);
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
        quantity,
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
        const { checkoutUrl } = await buyNowAction(selectedVariantId, quantity);
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
      <div className="flex gap-2.5">
        {quantityPicker ? (
          <div
            aria-label={tCart("itemQuantity")}
            className="grid h-12 w-32 shrink-0 grid-cols-[3rem_2rem_3rem] rounded-lg bg-background ring-1 ring-border ring-inset"
            role="group"
          >
            <button
              type="button"
              aria-label={tCart("decreaseQuantity")}
              className="flex size-12 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={quantity === 1}
              onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
            >
              <MinusIcon className="size-4 shrink-0" />
            </button>
            <span
              aria-live="polite"
              className="flex h-12 w-8 items-center justify-center text-sm font-medium tabular-nums"
              role="status"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label={tCart("increaseQuantity")}
              className="flex size-12 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={quantity === 99}
              onClick={() => setQuantity((currentQuantity) => Math.min(99, currentQuantity + 1))}
            >
              <PlusIcon className="size-4 shrink-0" />
            </button>
          </div>
        ) : null}
        <Button
          type="button"
          disabled={isOutOfStock || requiresBundleConfiguration}
          onClick={handleAddToCart}
          className="h-12 min-w-0 flex-1 justify-center"
        >
          {getButtonText()}
        </Button>
      </div>
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
              <BuyWithShopLogo aria-hidden="true" className="h-auto w-24.5" />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
