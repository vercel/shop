"use client";

import {
  AnalyticsEvent,
  createStorefrontAnalytics,
  type AnalyticsCart,
  type AnalyticsCartLine,
  type ShopAnalytics,
  type StorefrontAnalytics,
} from "@shopify/hydrogen";

import type { Cart, CartLine } from "@/lib/types";

export interface AnalyticsConfig {
  consentDomain: string;
  publicStorefrontAccessToken: string;
  shop: ShopAnalytics;
}

export interface ProductViewPayload {
  id: string;
  price: string;
  title: string;
  variantId: string;
  variantTitle: string;
  vendor: string;
}

let bus: StorefrontAnalytics | null = null;
let shopConfig: ShopAnalytics | null = null;
let lastCart: AnalyticsCart | null = null;
// Trackers are leaf components whose effects run before the initializer's, so
// pre-init publishes queue until the bus exists. The bus may never initialize
// (e.g. the analytics loader bails out for the session), so the queue is capped
// to drop the oldest entries and avoid unbounded growth / a memory leak.
const MAX_QUEUE_LENGTH = 100;
let queue: Array<(bus: StorefrontAnalytics) => void> = [];

export function initAnalytics({
  consentDomain,
  publicStorefrontAccessToken,
  shop,
}: AnalyticsConfig): void {
  if (typeof window === "undefined" || bus) return;

  shopConfig = shop;
  bus = createStorefrontAnalytics({
    consent: { consentDomain, publicStorefrontAccessToken },
    shop,
  });

  const pending = queue;
  queue = [];
  for (const publish of pending) publish(bus);
}

function withBus(publish: (bus: StorefrontAnalytics) => void): void {
  if (typeof window === "undefined") return;
  if (bus) {
    publish(bus);
  } else {
    // Cap the pre-init queue: if the bus never initializes, drop the oldest
    // pending publishes so the queue cannot grow without bound.
    if (queue.length >= MAX_QUEUE_LENGTH) queue.shift();
    queue.push(publish);
  }
}

export function trackPageView(): void {
  withBus((b) =>
    b.publish(AnalyticsEvent.PAGE_VIEWED, { shop: shopConfig, url: window.location.href }),
  );
}

export function trackProductView(product: ProductViewPayload): void {
  withBus((b) =>
    b.publish(AnalyticsEvent.PRODUCT_VIEWED, {
      products: [{ ...product, quantity: 1 }],
      shop: shopConfig,
      url: window.location.href,
    }),
  );
}

export function trackCollectionView(collection: { handle: string; id: string }): void {
  withBus((b) =>
    b.publish(AnalyticsEvent.COLLECTION_VIEWED, {
      collection,
      shop: shopConfig,
      url: window.location.href,
    }),
  );
}

export function trackSearchView(searchTerm: string): void {
  withBus((b) =>
    b.publish(AnalyticsEvent.SEARCH_VIEWED, {
      searchTerm,
      shop: shopConfig,
      url: window.location.href,
    }),
  );
}

export function trackCartView(): void {
  withBus((b) =>
    b.publish(AnalyticsEvent.CART_VIEWED, {
      cart: lastCart,
      prevCart: null,
      shop: shopConfig,
      url: window.location.href,
    }),
  );
}

/** Feed server-confirmed carts; the tracker dedupes by updatedAt, so optimistic copies are skipped. */
export function syncCartAnalytics(cart: Cart | null): void {
  if (!cart?.id || !cart.updatedAt) return;
  if (lastCart?.id === cart.id && lastCart.updatedAt === cart.updatedAt) return;

  const analyticsCart = toAnalyticsCart(cart.id, cart.updatedAt, cart.lines);
  lastCart = analyticsCart;
  withBus((b) => b.updateCart(analyticsCart));
}

function toAnalyticsCart(id: string, updatedAt: string, lines: CartLine[]): AnalyticsCart {
  return {
    id,
    updatedAt,
    lines: {
      nodes: lines
        .filter((line): line is CartLine & { id: string } => Boolean(line.id))
        .map(toAnalyticsCartLine),
    },
  };
}

function toAnalyticsCartLine(line: CartLine & { id: string }): AnalyticsCartLine {
  return {
    id: line.id,
    merchandise: {
      id: line.merchandise.id,
      price: {
        amount: line.merchandise.price?.amount ?? "0",
        currencyCode: line.merchandise.price?.currencyCode,
      },
      product: {
        handle: line.merchandise.product.handle,
        id: line.merchandise.product.id,
        title: line.merchandise.product.title,
        vendor: line.merchandise.product.vendor ?? "",
      },
      sku: line.merchandise.sku,
      title: line.merchandise.title,
    },
    quantity: line.quantity,
  };
}
