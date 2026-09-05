"use client";

import { getShopPayButtonUrl } from "@shopify/hydrogen";
import { cn } from "cn";
import { Loader2, MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/context";
import { useProductForm } from "@/components/product-detail/product-form";
import { Button } from "@/components/ui/button";
import type { ProductFormVariant } from "@/lib/product";

import { BuyWithShopLogo } from "./buy-with-shop-logo";

export function BuyButtons({
  availableForSale = true,
  buyWithShop = true,
  ctaColored = false,
  fallbackVariant,
  quantityPicker = true,
}: {
  availableForSale?: boolean;
  buyWithShop?: boolean;
  ctaColored?: boolean;
  fallbackVariant: ProductFormVariant | undefined;
  quantityPicker?: boolean;
}) {
  const { formProps, pending, register, selectedVariant: storeVariant } = useProductForm();
  const selectedVariant = storeVariant ?? fallbackVariant;

  const t = useTranslations("product");
  const tCart = useTranslations("cart");
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { openOverlay } = useCart();

  // Reset pending state when returning from checkout (bfcache / back navigation)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsBuyingNow(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  if (!selectedVariant) {
    return null;
  }

  const requiresBundleConfiguration = selectedVariant.requiresBundleConfiguration;
  const isOutOfStock = !selectedVariant.availableForSale;
  // Same-origin permalink; handleShopifyRoutes in proxy.ts 302s it to the store's checkout with attribution.
  // isBuyingNow must not feed `disabled`: React flushes the click's setState before the anchor's activation
  // behavior runs, so removing href here would cancel the navigation.
  const buyNowUrl = getShopPayButtonUrl({
    disabled: isOutOfStock || requiresBundleConfiguration,
    variants: [{ id: selectedVariant.id, quantity }],
  });

  const getButtonText = () => {
    if (pending) return t("addingToCart");
    if (requiresBundleConfiguration) return t("bundleConfigurationRequired");
    if (isOutOfStock) return t("outOfStock");
    return t("addToCart");
  };

  return (
    <form {...formProps({ beforeSubmit: openOverlay })} className="grid gap-2.5">
      <input type="hidden" {...register("merchandiseId", {})} />
      <input type="hidden" {...register("quantity", { value: quantity })} />
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
          {...register("addToCart", {})}
          disabled={isOutOfStock || requiresBundleConfiguration || pending}
          className={cn(
            "h-12 min-w-0 flex-1 justify-center",
            ctaColored && "bg-[#ff7900] text-white hover:bg-[#ff7900]/90",
          )}
        >
          {getButtonText()}
        </Button>
      </div>
      {buyWithShop ? (
        <a
          aria-busy={isBuyingNow || undefined}
          aria-disabled={buyNowUrl ? undefined : true}
          className={cn(
            "flex h-12 w-full cursor-pointer items-center justify-center rounded-lg border border-foreground bg-transparent px-4 text-foreground transition-colors hover:bg-accent aria-busy:pointer-events-none aria-disabled:pointer-events-none aria-disabled:opacity-50",
            !availableForSale && "invisible",
          )}
          href={buyNowUrl ?? undefined}
          onClick={() => setIsBuyingNow(true)}
          rel="nofollow"
        >
          {isBuyingNow ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <span className="sr-only">{t("buyWithShop")}</span>
              <BuyWithShopLogo aria-hidden="true" className="h-auto w-24.5" />
            </>
          )}
        </a>
      ) : null}
    </form>
  );
}
