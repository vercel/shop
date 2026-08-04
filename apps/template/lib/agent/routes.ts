import type { Locale } from "../i18n";
import { defaultLocale } from "../i18n";

export type AgentDestination =
  | "account"
  | "addresses"
  | "cart"
  | "checkout"
  | "collection"
  | "home"
  | "orders"
  | "product"
  | "search";

export type PageContext =
  | { handle: string; type: "collection" }
  | { handle: string; type: "product" }
  | { query: string; type: "search" }
  | { type: "cart" }
  | { type: "home" }
  | null;

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
      return identifier ? `/search?q=${encodeURIComponent(identifier)}` : "/search";
    default:
      return "/";
  }
}

export function parsePageContext(url: string | null): { locale: Locale; page: PageContext } {
  const locale = defaultLocale;
  if (!url) return { locale, page: null };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { locale, page: null };
  }

  const [segment, handle] = parsed.pathname.split("/").filter(Boolean);
  if (!segment) return { locale, page: { type: "home" } };
  if (segment === "products" && handle) return { locale, page: { handle, type: "product" } };
  if (segment === "collections" && handle) return { locale, page: { handle, type: "collection" } };
  if (segment === "search") {
    return { locale, page: { query: parsed.searchParams.get("q") ?? "", type: "search" } };
  }
  if (segment === "cart") return { locale, page: { type: "cart" } };
  return { locale, page: null };
}
