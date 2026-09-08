"use client";

import { formatMoney, getShopPayButtonUrl } from "@shopify/hydrogen";
import { cn } from "cn";
import { Loader2, MinusIcon, PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { useProductForm } from "@/components/product-detail/product-form";
import { Button } from "@/components/ui/button";
import type { ProductFormVariant } from "@/lib/product/types";

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

  const locale = useLocale();
  const t = useTranslations("product");
  const tCart = useTranslations("cart");
  const isSelectionUnresolved = !storeVariant;
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [purchaseOption, setPurchaseOption] = useState("");
  const purchaseOptionId = useId();
  const plans =
    selectedVariant?.sellingPlanAllocations.filter(
      (allocation) => allocation.sellingPlan.recurringDeliveries,
    ) ?? [];
  const selectedPlan =
    plans.find((allocation) => allocation.sellingPlan.id === purchaseOption) ??
    (selectedVariant?.requiresSellingPlan ? plans[0] : undefined);
  const missingRequiredPlan = Boolean(selectedVariant?.requiresSellingPlan && !selectedPlan);
  const { openOverlay } = useCartDrawer();

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
  // Keep href while buying: removing it during the click cancels the anchor's navigation.
  const buyNowUrl = getShopPayButtonUrl({
    disabled: isSelectionUnresolved || isOutOfStock || requiresBundleConfiguration,
    variants: [{ id: selectedVariant.id, quantity }],
  });

  const getButtonText = () => {
    if (pending) return t("addingToCart");
    if (isSelectionUnresolved) return t("addToCart");
    if (requiresBundleConfiguration) return t("bundleConfigurationRequired");
    if (missingRequiredPlan) return t("subscriptionUnavailable");
    if (isOutOfStock) return t("outOfStock");
    return t("addToCart");
  };

  return (
    <form
      {...formProps({
        beforeSubmit: (event) => {
          if (
            isSelectionUnresolved ||
            isOutOfStock ||
            requiresBundleConfiguration ||
            missingRequiredPlan ||
            pending
          ) {
            event.preventDefault();
            return;
          }
          openOverlay();
        },
      })}
      className="grid gap-2.5"
    >
      {plans.length > 0 ? (
        <fieldset className="grid gap-2.5" disabled={pending || isSelectionUnresolved}>
          <legend className="pb-2.5 text-sm font-medium">{t("purchaseOptions")}</legend>
          {[
            ...(!selectedVariant.requiresSellingPlan
              ? [{ id: "", name: t("oneTimePurchase"), price: selectedVariant.price }]
              : []),
            ...plans.map((allocation) => ({
              id: allocation.sellingPlan.id,
              name: allocation.sellingPlan.name,
              price: allocation.price,
            })),
          ].map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-4 has-checked:border-foreground has-disabled:cursor-not-allowed has-disabled:opacity-50"
            >
              <input
                type="radio"
                name={purchaseOptionId}
                value={option.id}
                checked={(selectedPlan?.sellingPlan.id ?? "") === option.id}
                onChange={() => setPurchaseOption(option.id)}
                className="size-4 cursor-pointer accent-foreground disabled:cursor-not-allowed"
              />
              <span className="flex flex-1 flex-wrap items-center justify-between gap-2.5 text-sm">
                <span>{option.name}</span>
                <span className="tabular-nums">
                  {formatMoney(option.price, { locale }).localizedString}
                </span>
              </span>
            </label>
          ))}
          {selectedPlan ? (
            <p className="text-sm text-muted-foreground">
              {t("recurringPurchase")}{" "}
              {selectedPlan.sellingPlan.description || t("subscriptionCheckoutDetails")}
            </p>
          ) : null}
        </fieldset>
      ) : null}
      <input type="hidden" name="sellingPlanId" value={selectedPlan?.sellingPlan.id ?? ""} />
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
          data-selection-unresolved={isSelectionUnresolved && !pending}
          disabled={
            isSelectionUnresolved ||
            isOutOfStock ||
            requiresBundleConfiguration ||
            missingRequiredPlan ||
            pending
          }
          className={cn(
            "h-12 min-w-0 flex-1 justify-center data-[selection-unresolved=true]:disabled:opacity-100",
            ctaColored && "bg-[#ff7900] text-white hover:bg-[#ff7900]/90",
          )}
        >
          {getButtonText()}
        </Button>
      </div>
      {buyWithShop && !selectedPlan && !selectedVariant.requiresSellingPlan ? (
        <a
          aria-busy={isBuyingNow || undefined}
          aria-disabled={buyNowUrl ? undefined : true}
          className={cn(
            "flex h-12 w-full cursor-pointer items-center justify-center rounded-lg border border-foreground bg-transparent px-4 text-foreground transition-colors hover:bg-accent aria-busy:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[selection-unresolved=true]:aria-disabled:opacity-100",
            !availableForSale && "invisible",
          )}
          data-selection-unresolved={isSelectionUnresolved}
          href={buyNowUrl ?? undefined}
          onClick={(event) => {
            if (!buyNowUrl || isBuyingNow) {
              event.preventDefault();
              return;
            }
            setIsBuyingNow(true);
          }}
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
