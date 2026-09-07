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
