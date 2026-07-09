"use client";

import type { ShopAnalytics } from "@shopify/hydrogen";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useCart } from "@/components/cart/context";
import {
  initAnalytics,
  syncCartAnalytics,
  trackCartView,
  trackCollectionView,
  trackPageView,
  trackProductView,
  trackSearchView,
  type ProductViewPayload,
} from "@/lib/analytics/client";

interface ShopifyAnalyticsClientProps {
  consentDomain: string;
  publicStorefrontAccessToken: string;
  shop: ShopAnalytics;
}

export function ShopifyAnalyticsClient({
  consentDomain,
  publicStorefrontAccessToken,
  shop,
}: ShopifyAnalyticsClientProps) {
  const { cart } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    initAnalytics({ consentDomain, publicStorefrontAccessToken, shop });
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the bus is a create-once singleton
  }, []);

  useEffect(() => {
    trackPageView();
  }, [pathname, search]);

  useEffect(() => {
    syncCartAnalytics(cart);
  }, [cart]);

  return null;
}

export function ProductViewTracker({ product }: { product: ProductViewPayload }) {
  useEffect(() => {
    trackProductView(product);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- one view per product navigation
  }, [product.id, product.variantId]);

  return null;
}

export function CollectionViewTracker({
  collection,
}: {
  collection: { handle: string; id: string };
}) {
  useEffect(() => {
    trackCollectionView(collection);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- one view per collection navigation
  }, [collection.id]);

  return null;
}

export function SearchViewTracker() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q") ?? "";

  useEffect(() => {
    if (searchTerm) trackSearchView(searchTerm);
  }, [searchTerm]);

  return null;
}

export function CartViewTracker() {
  useEffect(() => {
    trackCartView();
  }, []);

  return null;
}
