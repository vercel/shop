import { getSearchResultUrl } from "@shopify/hydrogen";

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
      return identifier ? getSearchResultUrl({ baseUrl: "/search", term: identifier }) : "/search";
    default:
      return "/";
  }
}

export function parsePageContext(url: string | null): {
  page: PageContext;
} {
  if (!url)
    return {
      page: null,
    };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      page: null,
    };
  }
  const [segment, handle] = parsed.pathname.split("/").filter(Boolean);
  if (!segment)
    return {
      page: { type: "home" },
    };
  if (segment === "products" && handle)
    return {
      page: { handle, type: "product" },
    };
  if (segment === "collections" && handle)
    return {
      page: { handle, type: "collection" },
    };
  if (segment === "search") {
    return {
      page: { query: parsed.searchParams.get("q") ?? "", type: "search" },
    };
  }
  if (segment === "cart")
    return {
      page: { type: "cart" },
    };
  return {
    page: null,
  };
}
