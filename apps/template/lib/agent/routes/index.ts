import { getSearchResultUrl } from "@shopify/hydrogen";

import type { AgentDestination } from "./types";

export function buildAgentPath(destination: AgentDestination, identifier?: string): string {
  switch (destination) {
    case "account":
      return "/account/profile";
    case "addresses":
      return "/account/addresses";
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
