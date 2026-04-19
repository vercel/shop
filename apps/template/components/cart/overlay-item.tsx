"use client";

import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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

  // Read quantity from cartWithPending (includes optimistic updates)
  const currentLine = cartWithPending?.lines.find((l) => l.id === item.id);
  const quantity = currentLine?.quantity ?? item.quantity;

  const currencyCode = item.cost.totalAmount.currencyCode;
  const unitPrice = item.merchandise.price
    ? parseFloat(item.merchandise.price.amount)
    : parseFloat(item.cost.totalAmount.amount) / item.quantity;

  return (
    <li
      className="flex gap-2.5"
      aria-label={`${item.merchandise.product.title} - ${formatPrice(unitPrice * quantity, currencyCode, locale)}`}
    >
      <Link
        href={`/products/${item.merchandise.product.handle}`}
        className="shrink-0 relative w-16 h-16 bg-muted overflow-hidden hover:opacity-80 transition-opacity"
      >
        <Image
          src={item.merchandise.image?.url || item.merchandise.product.featuredImage.url}
          alt={item.merchandise.image?.altText || item.merchandise.product.featuredImage.altText}
          fill
          className="object-cover"
          sizes="64px"
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-2 py-0.5">
        <div>
          <Link
            href={`/products/${item.merchandise.product.handle}`}
            className="hover:opacity-70 transition-opacity"
          >
            <h3 className="font-medium text-sm text-foreground line-clamp-2">
              {item.merchandise.product.title}
            </h3>
          </Link>

          {item.merchandise.selectedOptions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.merchandise.selectedOptions.map((option) => option.value).join(" / ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-7 rounded-full"
            onClick={() => updateItemOptimistic(item.id || "", quantity - 1)}
            disabled={quantity === 1}
            aria-label={t("decreaseQuantity")}
          >
            <MinusIcon className="size-3" />
          </Button>

          <span className="inline-flex items-center justify-center rounded-full bg-muted min-w-10.5 h-7 px-2.5 text-xs font-medium text-foreground">
            {quantity}
          </span>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-7 rounded-full"
            onClick={() => updateItemOptimistic(item.id || "", quantity + 1)}
            disabled={quantity === 99}
            aria-label={t("increaseQuantity")}
          >
            <PlusIcon className="size-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => updateItemOptimistic(item.id || "", 0)}
            aria-label={t("removeItem")}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="text-sm font-medium text-foreground self-start py-0.5">
        {formatPrice(unitPrice * quantity, currencyCode, locale)}
      </div>
    </li>
  );
}
