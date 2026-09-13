"use client";

import { useCart, useCartForm } from "@shopify/hydrogen/react";
import type { EveMessage } from "eve/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { CartCheckout } from "@/components/cart/checkout";
import { OverlayItem } from "@/components/cart/overlay-item";
import { CartTotal } from "@/components/cart/total";
import {
  ProductCard,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardTitle,
} from "@/components/product-card/components";
import { ProductInfoOptions } from "@/components/product-detail/product-info";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Slider, SliderContent, SliderHeader, SliderItem, SliderNav } from "@/components/ui/slider";
import { isCartMutation } from "@/lib/agent/cart";
import {
  defaultAgentSelection,
  findAgentVariant,
  selectAgentOption,
  toAgentOptionGroups,
} from "@/lib/agent/products";
import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";
import type { Cart } from "@/lib/cart/types";

interface CartConfirmation {
  label: string;
  warnings: string[];
}

interface ShoppingResultsProps {
  confirmation?: CartConfirmation;
  isLatest: boolean;
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

export function ShoppingResults({
  confirmation,
  isLatest,
  isStreaming,
  message,
}: ShoppingResultsProps) {
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
      ["present-products", "browse-collection", "get-recommendations"].includes(part.toolName) &&
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
          <Slider className="-mx-2.5 gap-2.5" key={part.toolCallId}>
            <SliderHeader className="justify-end px-2.5">
              <SliderNav />
            </SliderHeader>
            <SliderContent className="auto-cols-[calc((100%-0.625rem)/2)] gap-2.5 px-2.5 scroll-px-2.5">
              {cards}
            </SliderContent>
          </Slider>,
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
          isLatest={isLatest}
          product={product && "variants" in product ? product : undefined}
        />,
      );
    }
    if (part.toolName === "get-cart" && !hasCart) {
      hasCart = true;
      children.push(<AgentCartSummary key="cart" />);
    }
  }
  // The live cart renders once, on the latest turn; older turns keep their text confirmation.
  if (confirmation && !hasCart)
    children.push(
      <AgentCartSummary key="cart" title={confirmation.label} warnings={confirmation.warnings} />,
    );

  return children.length ? <div className="grid gap-4">{children}</div> : null;
}

function MissingData({ children }: { children: string }) {
  return <p className="my-2 text-muted-foreground text-xs">{children}</p>;
}

interface AgentCartSummaryProps {
  title?: string;
  warnings?: string[];
}

function AgentCartSummary({ title, warnings = [] }: AgentCartSummaryProps) {
  const cart = useCart<Cart, Cart>((state) => state.data);
  const isLoading = useCart((state) => state.loading);
  if (isLoading && cart.lines.nodes.length === 0)
    return (
      <div className="my-2 flex items-center gap-2.5 text-muted-foreground text-xs" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading cart…
      </div>
    );
  if (cart.lines.nodes.length === 0) return <MissingData>Your cart is empty</MissingData>;
  return (
    <div className="my-2 grid gap-5 rounded-lg border p-2.5">
      {title && (
        <div className="grid gap-1 text-sm">
          <p role="status">{title}</p>
          {warnings.map((warning) => (
            <p key={warning} role="alert" className="text-muted-foreground text-xs">
              {warning}
            </p>
          ))}
        </div>
      )}
      <ul className="grid gap-5" aria-label="Cart items">
        {cart.lines.nodes.map((line) => (
          <OverlayItem key={line.id} item={line} />
        ))}
      </ul>
      <CartTotal cart={cart} />
      <CartCheckout />
      <span className="sr-only">This cart updates as you change it.</span>
    </div>
  );
}

interface AgentProductCardProps {
  product: AgentProduct | undefined;
}

function AgentProductCard({ product }: AgentProductCardProps) {
  if (!product)
    return (
      <SliderItem>
        <MissingData>This product is no longer available.</MissingData>
      </SliderItem>
    );
  return (
    <SliderItem>
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
    </SliderItem>
  );
}

interface AgentVariantPickerProps {
  isLatest: boolean;
  product: AgentProductDetails | undefined;
}

function AgentVariantPicker({ isLatest, product }: AgentVariantPickerProps) {
  const { formProps, register } = useCartForm();
  const cartBusy = useCart((state) =>
    Boolean(state.pending.lines.size || state.pending.cost || state.revalidating),
  );
  const cartErrors = useCart((state) => state.errors);
  const [selected, setSelected] = useState(() => (product ? defaultAgentSelection(product) : {}));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<"added" | "failed" | null>(null);
  const observedBusy = useRef(false);
  const [errorsAtSubmit, setErrorsAtSubmit] = useState({ lines: 0, network: 0 });
  useEffect(() => {
    if (!submitted) return;
    if (cartBusy) {
      observedBusy.current = true;
      return;
    }
    if (!observedBusy.current) return;
    observedBusy.current = false;
    setSubmitted(false);
    const failed =
      cartErrors.linesUpdatedAt > errorsAtSubmit.lines ||
      cartErrors.networkUpdatedAt > errorsAtSubmit.network;
    setResult(failed ? "failed" : "added");
  }, [cartBusy, cartErrors, errorsAtSubmit, submitted]);
  if (!product) return <MissingData>This product is no longer available.</MissingData>;
  const variant = findAgentVariant(product, selected);
  const price = variant?.price ?? product.price;
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
  const canAdd = variant?.available && !variant.requiresComponents && !submitted;
  const buttonText = submitted
    ? "Adding to Cart..."
    : !variant
      ? "Add to Cart"
      : !variant.available
        ? "Out of Stock"
        : variant.requiresComponents
          ? "Choose bundle items"
          : "Add to Cart";
  return (
    <>
      <div className="my-2 overflow-hidden rounded-lg border">
        <div className="flex gap-2.5 border-b p-2.5">
          <Link
            href={`/products/${product.handle}`}
            className="relative size-11 shrink-0 overflow-hidden rounded-md"
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
          <div className="grid min-w-0 content-start gap-1">
            <Link href={`/products/${product.handle}`} className="hover:underline">
              <ProductCardTitle>{product.title}</ProductCardTitle>
            </Link>
            <ProductCardPrice
              amount={price.amount}
              compareAtAmount={compareAtPrice?.amount}
              compareAtCurrencyCode={compareAtPrice?.currencyCode}
              currencyCode={price.currencyCode}
            />
          </div>
        </div>
        <div className="grid gap-5 p-2.5">
          <ProductInfoOptions
            compact
            onSelectValue={(name, value) =>
              setSelected((current) => selectAgentOption(product, current, name, value))
            }
            options={toAgentOptionGroups(product, selected)}
          />
          <form
            {...formProps({
              beforeSubmit: () => {
                setErrorsAtSubmit({
                  lines: cartErrors.linesUpdatedAt,
                  network: cartErrors.networkUpdatedAt,
                });
                setResult(null);
                setSubmitted(true);
              },
            })}
          >
            <input type="hidden" {...register("merchandiseId", { value: variant?.id ?? "" })} />
            <input type="hidden" {...register("quantity", { value: 1 })} />
            <Button {...register("add")} className="w-full" disabled={!canAdd} type="submit">
              {buttonText}
            </Button>
          </form>
        </div>
      </div>
      {result === "added" && isLatest && <AgentCartSummary title="Added to cart" />}
      {result === "added" && !isLatest && (
        <p role="status" className="text-muted-foreground text-xs">
          Added to cart
        </p>
      )}
      {result === "failed" && (
        <p role="alert" className="text-red-500 text-xs">
          We couldn't add this to your cart. Check the cart before trying again.
        </p>
      )}
    </>
  );
}
