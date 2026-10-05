import { configureShopifyLogging } from "@/lib/shopify/logging/server";

export function register() {
  configureShopifyLogging();
}
