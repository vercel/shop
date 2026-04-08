"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CartLine } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

import { useCart } from "./context";

interface ItemRowProps {
  item: CartLine;
  locale: string;
}

export function ItemRow({ item, locale }: ItemRowProps) {
  const t = useTranslations("cart");
  const { cart, updateItemOptimistic } = useCart();

  const currentLine = cart?.lines.find((l) => l.id === item.id);
  const quantity = currentLine?.quantity ?? item.quantity;

  const { currencyCode, amount: totalAmount } = item.cost.totalAmount;
  const unitPrice = parseFloat(totalAmount) / item.quantity;

  const variantText = item.merchandise.selectedOptions.map((opt) => opt.value).join(" / ");

  return (
    <div className="flex gap-6 p-2">
      <Link
        href={`/products/${item.merchandise.product.handle}`}
        className="shrink-0 relative size-30 lg:size-38 bg-muted rounded-xl overflow-hidden hover:opacity-80 transition-opacity"
      >
        <Image
          src={item.merchandise.image?.url || item.merchandise.product.featuredImage.url}
          alt={item.merchandise.image?.altText || item.merchandise.product.featuredImage.altText}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 120px, 152px"
        />
      </Link>

      <div className="flex flex-1 justify-between items-start px-2 py-4">
        <div className="max-w-[297px]">
          <Link
            href={`/products/${item.merchandise.product.handle}`}
            className="block hover:opacity-70 transition-opacity"
          >
            <h3 className="text-lg lg:text-xl font-semibold tracking-[-0.3px] text-foreground line-clamp-2">
              {item.merchandise.product.title}
            </h3>
          </Link>

          {variantText && <p className="mt-1 text-sm font-semibold opacity-30">{variantText}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateItemOptimistic(item.id || "", quantity - 1)}
              disabled={quantity === 1}
              className="size-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 disabled:opacity-50 transition-colors text-sm font-medium"
              aria-label={t("decreaseQuantity")}
            >
              −
            </button>

            <Select
              value={quantity.toString()}
              onValueChange={(value) => updateItemOptimistic(item.id || "", Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-full bg-secondary border-0 px-3 text-sm font-medium shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={() => updateItemOptimistic(item.id || "", quantity + 1)}
              disabled={quantity === 99}
              className="size-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 disabled:opacity-50 transition-colors text-sm font-medium"
              aria-label={t("increaseQuantity")}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => updateItemOptimistic(item.id || "", 0)}
            className="size-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            aria-label={t("removeItem")}
          >
            <Trash2Icon className="size-3" />
          </button>
        </div>

        <p className="text-xl lg:text-2xl font-semibold tracking-[-0.48px]">
          {formatPrice(unitPrice * quantity, currencyCode, locale)}
        </p>
      </div>
    </div>
  );
}
