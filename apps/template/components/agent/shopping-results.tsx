"use client";

import { useCart, useCartForm } from "@shopify/hydrogen/react";
import { cn } from "cn";
import type { EveMessage } from "eve/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useState } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { OverlayItem } from "@/components/cart/overlay-item";
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
import { useCheckout } from "@/hooks/use-checkout";
import { isCartMutation } from "@/lib/agent/cart";
import type { AgentProduct, AgentProductDetails, AgentVariant } from "@/lib/agent/products/types";
import type { Cart } from "@/lib/cart/types";

interface ShoppingResultsProps {
  isStreaming: boolean;
  message: EveMessage;
}

function isAgentProduct(value: unknown): value is AgentProduct | AgentProductDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "handle" in value &&
    typeof value.handle === "string" &&
    "title" in value &&
    typeof value.title === "string"
  );
}

export function ShoppingResults({ isStreaming, message }: ShoppingResultsProps) {
  const products = new Map<string, AgentProduct | AgentProductDetails>();
  const results = message.parts.flatMap((part) => {
    if (part.type !== "dynamic-tool" || part.state !== "output-available" || part.partial)
      return [];
    const output = part.output;
    if (!output || typeof output !== "object") return [];
    const candidates = [
      ...("products" in output && Array.isArray(output.products) ? output.products : []),
      ...("product" in output && output.product ? [output.product] : []),
    ];
    for (const product of candidates) {
      if (isAgentProduct(product)) products.set(product.handle, product);
    }
    return "error" in output ? [] : [{ output, part }];
  });
  const changesCart = message.parts.some(
    (part) => part.type === "dynamic-tool" && isCartMutation(part.toolName),
  );
  const children: ReactNode[] = [];
  const seen = new Set<string>();
  let hasCart = false;

  for (const { output, part } of results) {
    if (
      ["present-products", "search-products", "browse-collection", "get-recommendations"].includes(
        part.toolName,
      ) &&
      "products" in output &&
      Array.isArray(output.products)
    ) {
      const cards = output.products.flatMap((product, index) => {
        if (
          !product ||
          typeof product !== "object" ||
          typeof product.handle !== "string" ||
          seen.has(product.handle)
        )
          return [];
        seen.add(product.handle);
        return [
          <AgentProductCard
            key={`${part.toolCallId}-${index}`}
            product={products.get(product.handle)}
          />,
        ];
      });
      if (cards.length) {
        children.push(
          <div className="my-2" key={part.toolCallId}>
            <div className="grid grid-cols-2 gap-2">{cards}</div>
          </div>,
        );
      }
    }
    if (isStreaming || changesCart) continue;
    if (
      part.toolName === "get-product-details" &&
      "product" in output &&
      output.product &&
      typeof output.product === "object" &&
      "handle" in output.product &&
      typeof output.product.handle === "string"
    ) {
      const product = products.get(output.product.handle);
      children.push(
        <AgentVariantPicker
          key={part.toolCallId}
          product={product && "variants" in product ? product : undefined}
        />,
      );
    }
    if (part.toolName === "get-cart" && !hasCart) {
      hasCart = true;
      children.push(<AgentCartSummary key="cart" />);
    }
  }

  return children.length ? <div className="grid gap-4">{children}</div> : null;
}

function MissingData({ children }: { children: string }) {
  return <p className="my-2 text-muted-foreground text-xs">{children}</p>;
}

function AgentCartSummary() {
  const cart = useCart<Cart, Cart>((state) => state.data);
  const {
    checkoutError,
    checkoutErrorId,
    handleCheckout,
    isCheckingOut,
    isCheckoutDisabled,
    isUpdatingCart,
  } = useCheckout();
  if (cart.lines.nodes.length === 0) return <MissingData>Your cart is empty</MissingData>;
  return (
    <div className="my-2 overflow-hidden rounded-lg border">
      <ul className="grid gap-2.5 p-2.5">
        {cart.lines.nodes.map((line) => (
          <OverlayItem key={line.id} item={line} />
        ))}
      </ul>
      <div className="border-t bg-muted/50 px-2.5 py-2">
        <div className="flex items-baseline justify-between font-medium text-sm">
          <span>Estimated total</span>
          {cart.cost.totalAmount.currencyCode ? (
            <Price
              amount={cart.cost.totalAmount.amount}
              className="text-sm"
              currencyCode={cart.cost.totalAmount.currencyCode}
            />
          ) : (
            <span className="text-muted-foreground">Updating…</span>
          )}
        </div>
        <p className="mt-1 text-muted-foreground text-xs">
          Taxes and shipping calculated at checkout.
        </p>
      </div>
      <div className="grid gap-2.5 border-t px-2.5 py-2">
        <Button
          aria-busy={isCheckingOut || isUpdatingCart || undefined}
          aria-describedby={checkoutError ? checkoutErrorId : undefined}
          className="h-12 w-full justify-center"
          disabled={isCheckoutDisabled}
          onClick={handleCheckout}
          type="button"
        >
          {isCheckingOut || isUpdatingCart ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isCheckingOut ? "Redirecting..." : isUpdatingCart ? "Updating cart..." : "Checkout"}
        </Button>
        {checkoutError ? (
          <p className="text-xs text-destructive" id={checkoutErrorId} role="alert">
            {checkoutError}
          </p>
        ) : null}
      </div>
      <span className="sr-only">This cart updates as you change it.</span>
    </div>
  );
}

interface AgentProductCardProps {
  product: AgentProduct | undefined;
}

function AgentProductCard({ product }: AgentProductCardProps) {
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
}

function variantLabel(variant: AgentVariant): string {
  return variant.options.map((option) => option.value).join(" / ") || variant.title;
}

interface AgentVariantPickerProps {
  product: AgentProductDetails | undefined;
}

function AgentVariantPicker({ product }: AgentVariantPickerProps) {
  const { openOverlay } = useCartDrawer();
  const { formProps, register } = useCartForm();
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
}
