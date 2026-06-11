import { getRequestConfig } from "next-intl/server";

import { defaultLocale, resolveLocale } from ".";
import type enMessages from "./messages/en.json";

// en-CA and fr-CA reuse the English UI catalog; only Shopify product content
// is localized (via @inContext) while testing the fr-CA market.
const messageLoaders = {
  "en-CA": () => import("./messages/en.json"),
  "en-US": () => import("./messages/en.json"),
  "fr-CA": () => import("./messages/en.json"),
} as const;

export default getRequestConfig(async () => {
  const locale = resolveLocale(defaultLocale);
  const messages = (await messageLoaders[locale]()).default as typeof enMessages;

  return { locale, messages };
});
