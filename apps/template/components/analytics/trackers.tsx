"use client";

import type { AnalyticsCart, CollectionViewPayload, ProductPayload } from "@shopify/hydrogen";
import { useCart } from "@shopify/hydrogen/react";
import { usePathname, useSearchParams } from "next/navigation";
import { use, useEffect, useRef } from "react";

import { AnalyticsEvent, getAnalytics } from "@/lib/analytics/client";
import type { ProductDetails, ProductVariant } from "@/lib/types";

export function CartViewedTracker() {
  const cartState = useCart((state) => state);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (cartState.loading || trackedRef.current) return;
    const cart = isAnalyticsCart(cartState.data) ? cartState.data : null;
    getAnalytics()?.publish(AnalyticsEvent.CART_VIEWED, { cart });
    trackedRef.current = true;
  }, [cartState.data, cartState.loading]);
  return null;
}

export function CollectionViewedTracker({
  collection,
}: {
  collection: CollectionViewPayload["collection"];
}) {
  const { handle, id } = collection;
  useEffect(() => {
    getAnalytics()?.publish(AnalyticsEvent.COLLECTION_VIEWED, { collection: { handle, id } });
  }, [handle, id]);
  return null;
}

export function PageViewedTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    getAnalytics()?.publish(AnalyticsEvent.PAGE_VIEWED);
  }, [pageKey]);
  return null;
}

export function ProductViewedTracker({
  product,
  variantPromise,
}: {
  product: Pick<ProductDetails, "handle" | "id" | "title" | "vendor">;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  const variant = use(variantPromise);
  const trackedHandleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!variant || trackedHandleRef.current === product.handle) return;
    const payload: ProductPayload = {
      id: product.id,
      price: variant.price.amount,
      quantity: 1,
      title: product.title,
      variantId: variant.id,
      variantTitle: variant.title,
      vendor: product.vendor ?? "",
    };
    getAnalytics()?.publish(AnalyticsEvent.PRODUCT_VIEWED, { products: [payload] });
    trackedHandleRef.current = product.handle;
  }, [product, variant]);
  return null;
}

export function SearchViewedTracker({ searchTerm }: { searchTerm: string }) {
  useEffect(() => {
    getAnalytics()?.publish(AnalyticsEvent.SEARCH_VIEWED, { searchTerm });
  }, [searchTerm]);
  return null;
}

function isAnalyticsCart(cart: Record<string, unknown>): cart is AnalyticsCart {
  return Boolean(cart.id && cart.updatedAt && cart.lines);
}
