"use client";

import { defineRegistry } from "@json-render/react";
import { cn } from "cn";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CartLineForm } from "@/components/cart/line-form";
import {
  ProductCard,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardTitle,
} from "@/components/product-card/components";
import { Price } from "@/components/product/price";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { catalog } from "@/lib/agent";
import type { AgentVariant } from "@/lib/agent/products";
import { useCartForm } from "@/lib/cart/client";

import { useCart } from "../cart/context";
import { useAgentProduct, useAgentProductDetails } from "./product-context";

function MissingData({ children }: { children: string }) {
  return <p className="my-2 text-muted-foreground text-xs">{children}</p>;
}

function variantLabel(variant: AgentVariant): string {
  return variant.options.map((option) => option.value).join(" / ") || variant.title;
}

export const { registry } = defineRegistry(catalog, {
  components: {
    AgentCartSummary: () => {
      const { cart } = useCart();
      if (!cart || cart.lines.length === 0) return <MissingData>Your cart is empty</MissingData>;
      return (
        <div className="my-2 overflow-hidden rounded-lg border">
          <ul className="divide-y">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex gap-2.5 p-2.5">
                <Link
                  href={`/products/${line.merchandise.product.handle}`}
                  className="relative size-12 shrink-0 overflow-hidden rounded-md"
                >
                  {line.merchandise.image?.url ? (
                    <Image
                      alt={line.merchandise.image.altText}
                      className="object-cover"
                      fill
                      sizes="48px"
                      src={line.merchandise.image.url}
                    />
                  ) : (
                    <ImagePlaceholder className="size-full" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/products/${line.merchandise.product.handle}`}
                    className="truncate font-medium text-sm hover:underline"
                  >
                    {line.merchandise.product.title}
                  </Link>
                  {line.merchandise.selectedOptions.length > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {line.merchandise.selectedOptions.map((option) => option.value).join(" / ")}
                    </span>
                  )}
                  <CartLineForm className="flex items-center gap-1.5" lineId={line.id ?? ""}>
                    {(register) => (
                      <>
                        <div
                          aria-label="Item quantity"
                          className="grid h-6 grid-cols-[1.75rem_1.5rem_1.75rem] rounded-full ring-1 ring-border ring-inset"
                          role="group"
                        >
                          <button
                            {...register("decrease")}
                            aria-label="Decrease quantity"
                            className="flex h-6 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!line.canUpdateQuantity || line.quantity === 1}
                            type="submit"
                          >
                            <MinusIcon className="size-3 shrink-0" />
                          </button>
                          <input
                            key={line.quantity}
                            {...register("quantity", {
                              interactive: true,
                              value: line.quantity,
                            })}
                            aria-label="Item quantity"
                            className="h-6 w-6 bg-transparent text-center font-medium text-xs tabular-nums outline-none"
                            disabled={!line.canUpdateQuantity}
                            max={99}
                            min={0}
                          />
                          <button
                            {...register("increase")}
                            aria-label="Increase quantity"
                            className="flex h-6 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!line.canUpdateQuantity || line.quantity === 99}
                            type="submit"
                          >
                            <PlusIcon className="size-3 shrink-0" />
                          </button>
                        </div>
                        <Button
                          {...register("remove")}
                          aria-label="Remove item"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          disabled={!line.canRemove}
                          size="icon"
                          type="submit"
                          variant="ghost"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </>
                    )}
                  </CartLineForm>
                </div>
                <Price
                  amount={line.cost.totalAmount.amount}
                  className="shrink-0 text-sm"
                  currencyCode={line.cost.totalAmount.currencyCode}
                />
              </li>
            ))}
          </ul>
          <div className="border-t bg-muted/50 px-2.5 py-2">
            <div className="flex items-baseline justify-between font-medium text-sm">
              <span>Estimated total</span>
              <Price
                amount={cart.cost.totalAmount.amount}
                className="text-sm"
                currencyCode={cart.cost.totalAmount.currencyCode}
              />
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              Taxes and shipping calculated at checkout.
            </p>
          </div>
          {cart.checkoutUrl && (
            <div className="border-t px-2.5 py-2">
              <Button asChild className="w-full" size="sm">
                <a href={cart.checkoutUrl}>Checkout</a>
              </Button>
            </div>
          )}
          <span className="sr-only">This cart updates as you change it.</span>
        </div>
      );
    },
    AgentProductCard: ({ props }) => {
      const product = useAgentProduct(props.handle);
      if (!product) return <MissingData>This product is no longer available.</MissingData>;
      return (
        <Link href={`/products/${product.handle}`} className="block">
          <ProductCard variant="default">
            <ProductCardImageContainer variant="default">
              <ProductCardImage
                alt={product.title}
                outOfStock={!product.available}
                outOfStockText="Out of Stock"
                src={product.image}
              />
              <ProductCardContent>
                <ProductCardTitle>{product.title}</ProductCardTitle>
                <ProductCardPrice
                  amount={product.price.amount}
                  compareAtAmount={product.compareAtPrice?.amount}
                  compareAtCurrencyCode={product.compareAtPrice?.currencyCode}
                  currencyCode={product.price.currencyCode}
                />
              </ProductCardContent>
            </ProductCardImageContainer>
          </ProductCard>
        </Link>
      );
    },
    AgentProductGrid: ({ children, props }) => (
      <div className="my-2">
        {props.title && (
          <h4 className="mb-2 font-medium text-muted-foreground text-xs">{props.title}</h4>
        )}
        <div className="grid grid-cols-2 gap-2">{children}</div>
      </div>
    ),
    AgentVariantPicker: ({ props }) => {
      const { openOverlay } = useCart();
      const { formProps, register } = useCartForm();
      const product = useAgentProductDetails(props.handle);
      const [selectedId, setSelectedId] = useState<string | null>(null);
      if (!product) return <MissingData>This product is no longer available.</MissingData>;
      const selected =
        product.variants.find((variant) => variant.id === selectedId) ??
        (product.variants.length === 1 ? product.variants[0] : undefined);
      const canAdd = selected?.available && !selected.requiresComponents;
      return (
        <div className="my-2 overflow-hidden rounded-lg border">
          <div className="flex gap-2.5 border-b p-2.5">
            <Link
              href={`/products/${product.handle}`}
              className="relative size-12 shrink-0 overflow-hidden rounded-md"
            >
              {product.image ? (
                <Image
                  alt={product.title}
                  className="object-cover"
                  fill
                  sizes="48px"
                  src={product.image}
                />
              ) : (
                <ImagePlaceholder className="size-full" />
              )}
            </Link>
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link
                href={`/products/${product.handle}`}
                className="truncate font-medium text-sm hover:underline"
              >
                {product.title}
              </Link>
              <span className="text-muted-foreground text-xs">Choose an option</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 p-2.5">
            {product.variants.map((variant) => (
              <button
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                  "data-[selected=true]:border-foreground data-[selected=true]:bg-foreground data-[selected=true]:text-background",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
                data-selected={selected?.id === variant.id}
                disabled={!variant.available}
                key={variant.id}
                onClick={() => setSelectedId(variant.id)}
                type="button"
              >
                {variantLabel(variant)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2.5 border-t px-2.5 py-2">
            <Price
              amount={(selected ?? product.variants[0])?.price.amount ?? product.price.amount}
              className="text-sm"
              currencyCode={
                (selected ?? product.variants[0])?.price.currencyCode ?? product.price.currencyCode
              }
            />
            <form {...formProps({ beforeSubmit: openOverlay })}>
              <input type="hidden" {...register("merchandiseId", { value: selected?.id ?? "" })} />
              <input type="hidden" {...register("quantity", { value: 1 })} />
              <Button {...register("add")} disabled={!canAdd} size="sm" type="submit">
                Add to Cart
              </Button>
            </form>
          </div>
        </div>
      );
    },
  },
});
