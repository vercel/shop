"use client";

import { defineRegistry } from "@json-render/react";
import { CheckCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createContext, useContext } from "react";

import {
  ProductCard,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardTitle,
} from "@/components/product-card/components";
import { Price } from "@/components/product/price";
import { catalog } from "@/lib/agent";
import { type Locale, type NamespaceMessages, formatPlural } from "@/lib/i18n";
import type { Money } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AgentRegistryLabels {
  agent: NamespaceMessages<"agent">;
  cart: NamespaceMessages<"cart">;
  locale: Locale;
  product: NamespaceMessages<"product">;
}

const Ctx = createContext<AgentRegistryLabels | null>(null);

export const AgentRegistryLabelsProvider = Ctx.Provider;

function useLabels(): AgentRegistryLabels {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("AgentRegistryLabelsProvider missing");
  }
  return value;
}

function parsePriceString(price: string): Money {
  const parts = price.split(" ");
  return {
    amount: parts[0] || "0",
    currencyCode: parts[1] || "USD",
  };
}

export const { registry } = defineRegistry(catalog, {
  components: {
    AgentProductCard: ({ props }) => {
      const { locale, product } = useLabels();
      const price = parsePriceString(props.price);
      const compareAtPrice = props.compareAtPrice
        ? parsePriceString(props.compareAtPrice)
        : undefined;

      return (
        <Link href={`/products/${props.handle}`} className="block">
          <ProductCard variant="default">
            <ProductCardImageContainer variant="default">
              <ProductCardImage
                src={props.image}
                alt={props.title}
                outOfStock={!props.available}
                outOfStockText={product.outOfStock}
                fallbackTitle={props.title}
                sizes="(max-width: 640px) 45vw, 180px"
              />
              <ProductCardContent>
                <ProductCardTitle>{props.title}</ProductCardTitle>
                <ProductCardPrice
                  amount={price.amount}
                  currencyCode={price.currencyCode}
                  compareAtAmount={compareAtPrice?.amount}
                  compareAtCurrencyCode={compareAtPrice?.currencyCode}
                  locale={locale}
                />
              </ProductCardContent>
            </ProductCardImageContainer>
          </ProductCard>
        </Link>
      );
    },

    AgentProductGrid: ({ props, children }) => {
      return (
        <div className="my-2">
          {props.title && (
            <h4 className="mb-2 font-medium text-muted-foreground text-xs">{props.title}</h4>
          )}
          <div className="grid grid-cols-2 gap-2">{children}</div>
        </div>
      );
    },

    AgentCartSummary: ({ props }) => {
      const { agent, cart, locale } = useLabels();
      const subtotal = parsePriceString(props.subtotal);
      const tax = parsePriceString(props.tax);
      const total = parsePriceString(props.total);
      const itemCountLabel = formatPlural(cart.itemCount, props.totalQuantity, locale);

      return (
        <div className="my-2 overflow-hidden rounded-lg border">
          <div className="border-b bg-muted/50 px-2.5 py-2">
            <h4 className="font-medium text-sm">
              {cart.title} ({itemCountLabel})
            </h4>
          </div>
          <div className="divide-y">
            {props.items.map((item) => {
              const itemPrice = parsePriceString(item.totalPrice);
              return (
                <div key={`${item.handle}-${item.options}`} className="flex gap-2.5 p-2.5">
                  {item.image ? (
                    <Link href={`/products/${item.handle}`} className="shrink-0">
                      <Image
                        src={item.image}
                        alt={item.productTitle}
                        width={48}
                        height={48}
                        className="rounded-md object-cover"
                      />
                    </Link>
                  ) : (
                    <div className="size-12 shrink-0 rounded-md bg-muted" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                      href={`/products/${item.handle}`}
                      className="truncate font-medium text-sm hover:underline"
                    >
                      {item.productTitle}
                    </Link>
                    {item.options && (
                      <span className="text-muted-foreground text-xs">{item.options}</span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {agent.qtyShort}: {item.quantity}
                    </span>
                  </div>
                  <Price
                    amount={itemPrice.amount}
                    currencyCode={itemPrice.currencyCode}
                    locale={locale}
                    className="shrink-0 text-sm"
                  />
                </div>
              );
            })}
          </div>
          <div className="border-t bg-muted/50 px-2.5 py-2">
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>{cart.subtotal}</span>
              <Price
                amount={subtotal.amount}
                currencyCode={subtotal.currencyCode}
                locale={locale}
              />
            </div>
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>{cart.estimatedTax}</span>
              <Price amount={tax.amount} currencyCode={tax.currencyCode} locale={locale} />
            </div>
            <div className="mt-1 flex justify-between border-t pt-1 font-medium text-sm">
              <span>{cart.total}</span>
              <Price amount={total.amount} currencyCode={total.currencyCode} locale={locale} />
            </div>
          </div>
          <div className="border-t px-2.5 py-2">
            <a
              href={props.checkoutUrl}
              className="block w-full rounded-lg bg-foreground px-5 py-2 text-center font-medium text-background text-sm hover:bg-foreground/90"
            >
              {cart.checkout}
            </a>
          </div>
        </div>
      );
    },

    AgentCartConfirmation: ({ props }) => {
      const { agent, cart, locale } = useLabels();
      const price = parsePriceString(props.price);

      return (
        <div className="my-2 overflow-hidden rounded-lg border border-positive/30 bg-positive/5">
          <div className="flex items-center gap-2 border-b border-positive/30 px-2.5 py-2">
            <CheckCircleIcon className="size-4 text-positive" />
            <span className="font-medium text-positive text-sm">{cart.addedToCart}</span>
          </div>
          <div className="flex gap-2.5 p-2.5">
            {props.image ? (
              <Link href={`/products/${props.handle}`} className="shrink-0">
                <Image
                  src={props.image}
                  alt={props.productTitle}
                  width={56}
                  height={56}
                  className="rounded-md object-cover"
                />
              </Link>
            ) : (
              <div className="size-14 shrink-0 rounded-md bg-muted" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link
                href={`/products/${props.handle}`}
                className="truncate font-medium text-sm hover:underline"
              >
                {props.productTitle}
              </Link>
              {props.variantTitle && (
                <span className="text-muted-foreground text-xs">{props.variantTitle}</span>
              )}
              <span className="text-muted-foreground text-xs">
                {agent.qtyShort}: {props.quantity}
              </span>
            </div>
            <Price
              amount={price.amount}
              currencyCode={price.currencyCode}
              locale={locale}
              className="shrink-0 text-sm"
            />
          </div>
        </div>
      );
    },

    AgentVariantPicker: ({ props }) => {
      const { agent, locale, product } = useLabels();

      return (
        <div className="my-2 overflow-hidden rounded-lg border">
          <div className="flex gap-2.5 border-b p-2.5">
            {props.image ? (
              <Link href={`/products/${props.handle}`} className="shrink-0">
                <Image
                  src={props.image}
                  alt={props.productTitle}
                  width={48}
                  height={48}
                  className="rounded-md object-cover"
                />
              </Link>
            ) : (
              <div className="size-12 shrink-0 rounded-md bg-muted" />
            )}
            <div className="flex flex-col gap-0.5">
              <Link
                href={`/products/${props.handle}`}
                className="font-medium text-sm hover:underline"
              >
                {props.productTitle}
              </Link>
              <span className="text-muted-foreground text-xs">{agent.chooseVariant}</span>
            </div>
          </div>
          {props.options.length > 0 && (
            <div className="space-y-2 border-b p-2.5">
              {props.options.map((option) => (
                <div key={option.name}>
                  <span className="mb-1 block font-medium text-muted-foreground text-xs">
                    {option.name}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {option.values.map((value) => (
                      <span key={value} className="rounded-full border px-2 py-0.5 text-xs">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="divide-y">
            {props.variants.map((variant) => {
              const variantPrice = parsePriceString(variant.price);
              return (
                <div
                  key={variant.id}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2",
                    !variant.available && "opacity-50",
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{variant.title}</span>
                    {variant.options && (
                      <span className="text-muted-foreground text-xs">{variant.options}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Price
                      amount={variantPrice.amount}
                      currencyCode={variantPrice.currencyCode}
                      locale={locale}
                      className="text-sm"
                    />
                    {!variant.available && (
                      <span className="text-destructive text-xs">{product.outOfStock}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
  },
});
