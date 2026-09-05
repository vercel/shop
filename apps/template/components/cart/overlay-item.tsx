"use client";

import { type CartLine as HydrogenCartLine, formatMoney } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CartLineForm } from "@/components/cart/line-form";
import { CartWarnings } from "@/components/cart/warnings";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { CartLine } from "@/lib/cart";
import { shopConfig } from "@/lib/config";

interface OverlayItemProps {
  item: CartLine;
}

export function OverlayItem({ item }: OverlayItemProps) {
  const isPending = useCart((state) => state.pending.lines.has(item.id));
  const isCostPending = useCart((state) =>
    Boolean(state.pending.cost || state.revalidating || state.pending.lines.has(item.id)),
  );
  const { cost, merchandise, quantity } = item;
  const instructions = "instructions" in item ? item.instructions : undefined;
  const canUpdateQuantity = !(
    instructions &&
    typeof instructions === "object" &&
    "canUpdateQuantity" in instructions &&
    instructions.canUpdateQuantity === false
  );
  const canRemove = !(
    instructions &&
    typeof instructions === "object" &&
    "canRemove" in instructions &&
    instructions.canRemove === false
  );
  const components = (item as HydrogenCartLine).lineComponents ?? [];
  const isOptimistic = item.id.startsWith("optimistic:");
  const currencyCode = cost.totalAmount.currencyCode;
  const finalUnitPrice = quantity > 0 ? Number(cost.totalAmount.amount) / quantity : 0;
  const sellingUnitPrice = Number(cost.amountPerQuantity.amount);
  const compareAtUnitPrice = Number(cost.compareAtAmountPerQuantity?.amount ?? 0);
  const originalUnitPrice =
    finalUnitPrice < sellingUnitPrice ? sellingUnitPrice : compareAtUnitPrice;
  const title = merchandise?.product.title || "Cart item";
  const href = merchandise?.product.handle ? `/products/${merchandise.product.handle}` : undefined;
  const image = merchandise?.image;
  const imageContent = image?.url ? (
    <Image
      src={image.url}
      alt={image.altText || title}
      fill
      className="object-cover"
      sizes="72px"
    />
  ) : (
    <ImagePlaceholder className="size-full" />
  );
  const price = (amount: number) =>
    formatMoney(
      { amount: String(amount), currencyCode },
      { locale: shopConfig.localization.locale },
    ).localizedString;

  return (
    <li className="flex gap-2.5" aria-busy={isPending || undefined} aria-label={title}>
      {href ? (
        <Link
          href={href}
          className="relative size-18 shrink-0 cursor-pointer self-start overflow-hidden transition-opacity hover:opacity-80"
        >
          {imageContent}
        </Link>
      ) : (
        <div className="relative size-18 shrink-0 self-start overflow-hidden">{imageContent}</div>
      )}
      <div className="grid min-h-18 min-w-0 flex-1 gap-2.5 pt-0.5">
        <div className="grid gap-2.5">
          <div className="grid gap-1">
            {href ? (
              <Link href={href} className="cursor-pointer transition-opacity hover:opacity-70">
                <h3 className="line-clamp-1 text-sm font-medium text-foreground">{title}</h3>
              </Link>
            ) : (
              <h3 className="line-clamp-1 text-sm font-medium text-foreground">{title}</h3>
            )}
            {merchandise?.selectedOptions?.length ? (
              <p className="text-xs text-muted-foreground">
                {merchandise.selectedOptions.map((option) => option.value).join(" / ")}
              </p>
            ) : null}
          </div>
          {components.length ? (
            <div className="grid gap-1">
              <p className="text-xs font-medium text-muted-foreground">Bundle Includes</p>
              <ul className="grid gap-0.5">
                {components.map((component) => (
                  <li
                    key={component.id}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="truncate">
                      {component.merchandise?.product.title || "Bundle item"}
                    </span>
                    {component.quantity > 1 ? <span>×{component.quantity}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <CartLineForm
          className="flex items-center gap-1.5 self-end"
          lineId={item.id}
          minQuantity={canRemove ? 0 : 1}
        >
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
                  disabled={isOptimistic || !canUpdateQuantity || quantity <= 1}
                >
                  <MinusIcon className="size-3 shrink-0" />
                </button>
                <input
                  key={quantity}
                  {...register("quantity", { interactive: true, value: quantity })}
                  aria-label="Item quantity"
                  className="h-6 w-6 bg-transparent text-center text-xs font-medium tabular-nums outline-none disabled:cursor-not-allowed"
                  disabled={isOptimistic || !canUpdateQuantity}
                  max={99}
                  min={canRemove ? 0 : 1}
                />
                <button
                  {...register("increase")}
                  type="submit"
                  aria-label="Increase quantity"
                  className="flex h-6 cursor-pointer items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isOptimistic || !canUpdateQuantity || quantity >= 99}
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
                disabled={isOptimistic || !canRemove}
                aria-label="Remove item"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </>
          )}
        </CartLineForm>
        <CartWarnings lineId={item.id} />
      </div>
      <div className="grid gap-0.5 self-start py-0.5 text-right text-sm">
        <span className="font-medium text-foreground">
          {isCostPending || !currencyCode ? "Updating…" : price(finalUnitPrice)}
        </span>
        {!isCostPending && currencyCode && originalUnitPrice > finalUnitPrice ? (
          <span className="text-xs text-muted-foreground line-through">
            {price(originalUnitPrice)}
          </span>
        ) : null}
      </div>
    </li>
  );
}
