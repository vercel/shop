"use client";

import { MinusIcon, PlusIcon, TagIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { CartLine } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

import { useCart } from "./context";

interface OverlayItemProps {
  item: CartLine;
  locale: string;
}

export function OverlayItem({ item, locale }: OverlayItemProps) {
  const { cartWithPending, updateItemOptimistic } = useCart();
  const t = useTranslations("cart");

  const currentLine = cartWithPending?.lines.find((l) => l.id === item.id);
  const quantity = currentLine?.quantity ?? item.quantity;

  const currencyCode = item.cost.totalAmount.currencyCode;
  const finalUnitPrice = parseFloat(item.cost.totalAmount.amount) / item.quantity;
  const sellingUnitPrice = item.merchandise.price
    ? parseFloat(item.merchandise.price.amount)
    : finalUnitPrice;
  const compareAtUnitPrice = item.merchandise.compareAtPrice
    ? parseFloat(item.merchandise.compareAtPrice.amount)
    : null;
  const hasCartDiscount = item.discountAllocations.length > 0 && finalUnitPrice < sellingUnitPrice;
  const hasCompareAt =
    !hasCartDiscount && compareAtUnitPrice != null && compareAtUnitPrice > sellingUnitPrice;

  return (
    <li
      className="flex gap-2.5"
      aria-label={`${item.merchandise.product.title} - ${formatPrice(finalUnitPrice * quantity, currencyCode, locale)}`}
    >
      <Link
        href={`/products/${item.merchandise.product.handle}`}
        className="shrink-0 relative size-18 self-end overflow-hidden hover:opacity-80 transition-opacity"
      >
        {(() => {
          const imageUrl =
            item.merchandise.image?.url || item.merchandise.product.featuredImage.url;
          return imageUrl ? (
            <Image
              src={imageUrl}
              alt={
                item.merchandise.image?.altText || item.merchandise.product.featuredImage.altText
              }
              fill
              className="object-cover"
              sizes="72px"
            />
          ) : (
            <ImagePlaceholder className="size-full" />
          );
        })()}
      </Link>

      <div className="flex-1 min-w-0 min-h-18 flex flex-col gap-2 pt-0.5">
        <div>
          <Link
            href={`/products/${item.merchandise.product.handle}`}
            className="hover:opacity-70 transition-opacity"
          >
            <h3 className="font-medium text-sm text-foreground line-clamp-1">
              {item.merchandise.product.title}
            </h3>
          </Link>

          {item.merchandise.selectedOptions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.merchandise.selectedOptions.map((option) => option.value).join(" / ")}
            </p>
          )}

          {item.discountAllocations.length > 0 ? (
            <ul className="mt-1 grid gap-0.5">
              {item.discountAllocations.map((allocation, index) => {
                const label = allocation.kind === "code" ? allocation.code : allocation.title;
                if (!label) return null;
                return (
                  <li
                    key={`${allocation.kind}-${label}-${index}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <TagIcon className="size-3 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {item.components.length > 0 && (
            <div className="mt-2 grid gap-1">
              <p className="text-xs font-medium text-muted-foreground">{t("bundleIncludes")}</p>
              <ul className="grid gap-0.5">
                {item.components.map((component) => (
                  <li
                    key={component.id}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="truncate">{component.merchandise.product.title}</span>
                    {component.quantity > 1 ? <span>×{component.quantity}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-auto">
          <div
            aria-label={t("itemQuantity")}
            className="grid h-6 grid-cols-[1.75rem_1.5rem_1.75rem] rounded-full ring-1 ring-border ring-inset"
            role="group"
          >
            <button
              type="button"
              aria-label={t("decreaseQuantity")}
              className="flex h-6 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!item.canUpdateQuantity || quantity === 1}
              onClick={() => updateItemOptimistic(item.id || "", quantity - 1)}
            >
              <MinusIcon className="size-3 shrink-0" />
            </button>
            <span
              aria-live="polite"
              className="flex h-6 w-6 items-center justify-center text-xs font-medium tabular-nums"
              role="status"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label={t("increaseQuantity")}
              className="flex h-6 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!item.canUpdateQuantity || quantity === 99}
              onClick={() => updateItemOptimistic(item.id || "", quantity + 1)}
            >
              <PlusIcon className="size-3 shrink-0" />
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => updateItemOptimistic(item.id || "", 0)}
            disabled={!item.canRemove}
            aria-label={t("removeItem")}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="self-start py-0.5 text-sm text-right">
        <div className="grid gap-0.5">
          <span className="font-medium text-foreground">
            {formatPrice(hasCartDiscount ? finalUnitPrice : sellingUnitPrice, currencyCode, locale)}
          </span>
          {hasCartDiscount ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(sellingUnitPrice, currencyCode, locale)}
            </span>
          ) : hasCompareAt ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtUnitPrice, currencyCode, locale)}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
