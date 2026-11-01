"use client";

import type { EveMessage } from "eve/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { CartLineItems } from "@/components/cart/line-item";
import { CartCheckout, CartTotal } from "@/components/cart/summary";
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
import { Link } from "@/components/ui/link";
import { Slider, SliderContent, SliderHeader, SliderItem, SliderNav } from "@/components/ui/slider";
import { isCartMutation } from "@/lib/agent/cart";
import { completedOutput, isToolPart } from "@/lib/agent/messages";
import {
  defaultAgentSelection,
  findAgentVariant,
  selectAgentOption,
  toAgentOptionGroups,
} from "@/lib/agent/products";
import type {
  AgentProduct,
  AgentProductDetails,
  CompleteAgentProductDetails,
} from "@/lib/agent/products/types";
import { AGENT_TOOL, PRODUCT_CARD_TOOLS } from "@/lib/agent/tools";
import { useCart, useCartForm } from "@/lib/cart/client";
import { buildProductUrl } from "@/lib/product";

interface CartConfirmation {
  warnings: string[];
}

interface ShoppingResultsProps {
  confirmation?: CartConfirmation;
  fallback?: ReactNode;
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

function hasCompleteVariants(
  product: AgentProduct | AgentProductDetails,
): product is CompleteAgentProductDetails {
  return (
    "variantsComplete" in product &&
    product.variantsComplete === true &&
    Array.isArray(product.variants) &&
    product.variants.length > 0 &&
    Array.isArray(product.options)
  );
}

function wantsOptions(input: unknown) {
  return typeof input === "object" && input !== null && "showOptions" in input
    ? input.showOptions === true
    : false;
}

export function ShoppingResults({
  confirmation,
  fallback = null,
  isLatest,
  isStreaming,
  message,
}: ShoppingResultsProps) {
  const products = new Map<string, AgentProduct | AgentProductDetails>();
  const productDetails = new Map<string, AgentProduct | AgentProductDetails>();
  const results = message.parts.filter(isToolPart).flatMap((part) => {
    const output = completedOutput(part);
    if (!output) return [];
    const candidates = [
      ...("products" in output && Array.isArray(output.products) ? output.products : []),
      ...("product" in output && output.product ? [output.product] : []),
    ];
    for (const product of candidates) {
      if (isAgentProduct(product)) products.set(product.handle, product);
    }
    if (
      part.name === AGENT_TOOL.getProductDetails &&
      "product" in output &&
      isAgentProduct(output.product)
    ) {
      productDetails.set(output.product.handle, output.product);
    }
    return "error" in output ? [] : [{ output, part }];
  });
  const changesCart = message.parts.some((part) => isToolPart(part) && isCartMutation(part.name));
  const children: ReactNode[] = [];
  const seen = new Set<string>();
  const shownOptions = new Set<string>();
  let hasCart = false;

  for (const { output, part } of results) {
    if (
      PRODUCT_CARD_TOOLS.has(part.name) &&
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
            key={`${part.callId}-${index}`}
            product={products.get(product.handle)}
          />,
        ];
      });
      if (cards.length) {
        children.push(
          <Slider className="-mx-2.5 gap-2.5" key={part.callId}>
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
      part.name === AGENT_TOOL.getProductDetails &&
      wantsOptions(part.input) &&
      "product" in output &&
      isAgentProduct(output.product)
    ) {
      const product = productDetails.get(output.product.handle) ?? output.product;
      if (shownOptions.has(product.handle)) continue;
      shownOptions.add(product.handle);
      if (!hasCompleteVariants(product)) {
        children.push(
          <div key={part.callId} className="my-2 grid gap-2 rounded-lg border p-2.5">
            <p>Choose options for {product.title} on the product page.</p>
            <Button render={<Link href={`/products/${product.handle}`} />}>Choose options</Button>
          </div>,
        );
      } else {
        children.push(
          <AgentVariantPicker key={part.callId} isLatest={isLatest} product={product} />,
        );
      }
    }
    if (part.name === AGENT_TOOL.getCart && !hasCart && isLatest) {
      hasCart = true;
      children.push(<AgentCartSummary key="cart" />);
    }
  }
  // Only the latest turn renders the editable cart; older turns rely on the assistant's text.
  if (confirmation && !hasCart)
    children.push(<AgentCartSummary key="cart" warnings={confirmation.warnings} />);

  return children.length ? <div className="grid gap-4">{children}</div> : fallback;
}

function MissingData({ children }: { children: string }) {
  return <p className="my-2 text-muted-foreground text-xs">{children}</p>;
}

interface AgentCartSummaryProps {
  warnings?: string[];
}

function AgentCartSummary({ warnings = [] }: AgentCartSummaryProps) {
  const cart = useCart((state) => state.data);
  const isLoading = useCart((state) => state.loading);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest" });
  }, []);
  if (isLoading && cart.lines.nodes.length === 0)
    return (
      <div className="my-2 flex items-center gap-2.5 text-muted-foreground text-xs" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading cart…
      </div>
    );
  if (cart.lines.nodes.length === 0) return <MissingData>Your cart is empty</MissingData>;
  return (
    <div ref={ref} className="my-2 grid gap-5 rounded-lg border p-2.5">
      {warnings.length > 0 && (
        <div className="grid gap-1">
          {warnings.map((warning) => (
            <p key={warning} role="alert" className="text-muted-foreground text-xs">
              {warning}
            </p>
          ))}
        </div>
      )}
      <CartLineItems lines={cart.lines.nodes} />
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
        <ProductCard>
          <ProductCardImageContainer>
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
  product: CompleteAgentProductDetails;
}

function AgentVariantPicker({ isLatest, product }: AgentVariantPickerProps) {
  const { formProps, register } = useCartForm();
  const cartBusy = useCart((state) =>
    Boolean(state.pending.lines.size || state.pending.cost || state.revalidating),
  );
  const cartErrors = useCart((state) => state.errors);
  const [selected, setSelected] = useState(() => defaultAgentSelection(product));
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
  const variant = findAgentVariant(product, selected);
  const price = variant?.price ?? product.price;
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
  const choosePlan = variant?.available && variant.requiresSellingPlan;
  const canAdd = variant?.available && !variant.requiresBundleConfiguration && !submitted;
  const buttonText = submitted
    ? "Adding to Cart..."
    : !variant
      ? "Add to Cart"
      : !variant.available
        ? "Out of Stock"
        : variant.requiresBundleConfiguration
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
                sizes="100vw"
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
          {choosePlan ? (
            <Button
              className="w-full"
              render={<Link href={buildProductUrl(product.handle, variant.options)} />}
            >
              Choose a subscription
            </Button>
          ) : (
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
          )}
        </div>
      </div>
      {result === "added" && isLatest && <AgentCartSummary />}
      {result === "failed" && (
        <p role="alert" className="text-red-500 text-xs">
          We couldn't add this to your cart. Check the cart before trying again.
        </p>
      )}
    </>
  );
}
