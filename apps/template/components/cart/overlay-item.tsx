"use client";

import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CartLineForm } from "@/components/cart/line-form";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { shopConfig } from "@/lib/config";
import type { CartLine } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

import { useCart } from "./context";

interface OverlayItemProps {
  item: CartLine;
}

export function OverlayItem({ item }: OverlayItemProps) {
  const { cartWithPending } = useCart();
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
      aria-label={`${item.merchandise.product.title} - ${formatPrice(
        { amount: finalUnitPrice * quantity, currencyCode },
        shopConfig.localization.locale,
      )}`}
    >
      <Link
        href={`/products/${item.merchandise.product.handle}`}
        className="shrink-0 relative size-18 self-start overflow-hidden hover:opacity-80 transition-opacity"
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

          {item.components.length > 0 && (
            <div className="mt-2 grid gap-1">
              <p className="text-xs font-medium text-muted-foreground">Bundle Includes</p>
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

        <CartLineForm className="flex items-center gap-1.5 mt-auto" lineId={item.id ?? ""}>
          {(register) => (
            <>
              <div
                aria-label="Item quantity"
                className="grid h-6 grid-cols-[1.75rem_1.5rem_1.75rem] rounded-full ring-1 ring-border ring-inset"
                role="group"
              >
                <button
                  {...register("decrease")}
                  type="submit"
                  aria-label="Decrease quantity"
                  className="flex h-6 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!item.canUpdateQuantity || quantity === 1}
                >
                  <MinusIcon className="size-3 shrink-0" />
                </button>
                <input
                  key={quantity}
                  {...register("quantity", { interactive: true, value: quantity })}
                  aria-label="Item quantity"
                  className="h-6 w-6 bg-transparent text-center text-xs font-medium tabular-nums outline-none"
                  disabled={!item.canUpdateQuantity}
                  max={99}
                  min={0}
                />
                <button
                  {...register("increase")}
                  type="submit"
                  aria-label="Increase quantity"
                  className="flex h-6 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!item.canUpdateQuantity || quantity === 99}
                >
                  <PlusIcon className="size-3 shrink-0" />
                </button>
              </div>

              <Button
                {...register("remove")}
                type="submit"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                disabled={!item.canRemove}
                aria-label="Remove item"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </>
          )}
        </CartLineForm>
      </div>

      <div className="self-start py-0.5 text-sm text-right">
        <div className="grid gap-0.5">
          <span className="font-medium text-foreground">
            {formatPrice(
              { amount: hasCartDiscount ? finalUnitPrice : sellingUnitPrice, currencyCode },
              shopConfig.localization.locale,
            )}
          </span>
          {hasCartDiscount ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(
                { amount: sellingUnitPrice, currencyCode },
                shopConfig.localization.locale,
              )}
            </span>
          ) : hasCompareAt ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(
                { amount: compareAtUnitPrice, currencyCode },
                shopConfig.localization.locale,
              )}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
