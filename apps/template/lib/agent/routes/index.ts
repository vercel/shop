import { getSearchResultUrl } from "@shopify/hydrogen";

import { defaultLocale, isEnabledLocale, resolveLocale, type Locale } from "@/lib/i18n";

import type { AgentDestination, PageContext } from "./types";

export function buildAgentPath(destination: AgentDestination, identifier?: string): string {
  switch (destination) {
    case "account":
      return "/account/profile";
    case "addresses":
      return "/account/addresses";
    // Checkout lives on Shopify behind a cart-owned URL, so send shoppers to the cart to continue.
    case "cart":
    case "checkout":
      return "/cart";
    case "collection":
      return identifier ? `/collections/${identifier}` : "/collections";
    case "orders":
      return "/account/orders";
    case "product":
      return identifier ? `/products/${identifier}` : "/";
    case "search":
      return identifier ? getSearchResultUrl({ baseUrl: "/search", term: identifier }) : "/search";
    default:
      return "/";
  }
}

export function parsePageContext(
  url: string | null,
  fallbackLocale: Locale = defaultLocale,
): {
  locale: Locale;
  page: PageContext;
} {
  let locale = fallbackLocale;
  if (!url) return { locale, page: null };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { locale, page: null };
  }
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (isEnabledLocale(segments[0] ?? "")) {
    locale = resolveLocale(segments.shift());
  } else if (isEnabledLocale(segments[1] ?? "")) {
    segments.shift();
    locale = resolveLocale(segments.shift());
  }
  const [segment, handle] = segments;
  if (!segment) return { locale, page: { type: "home" } };
  if (segment === "products" && handle) return { locale, page: { handle, type: "product" } };
  if (segment === "collections" && handle) return { locale, page: { handle, type: "collection" } };
  if (segment === "search") {
    return { locale, page: { query: parsed.searchParams.get("q") ?? "", type: "search" } };
  }
  if (segment === "cart") return { locale, page: { type: "cart" } };
  return { locale, page: null };
}
