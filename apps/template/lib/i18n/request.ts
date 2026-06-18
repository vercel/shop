import { getRequestConfig } from "next-intl/server";

import { getLocale } from "../params";
import type enMessages from "./messages/en.json";

const messageLoaders = {
  "en-CA": () => import("./messages/en.json"),
  "en-US": () => import("./messages/en.json"),
  "fr-CA": () => import("./messages/fr.json"),
} as const;

// Resolve via getLocale() (next/root-params) rather than next-intl's callback
// `{ locale }` arg — that reads the x-next-intl-locale header and forces the
// route dynamic under cacheComponents.
export default getRequestConfig(async () => {
  const locale = await getLocale();
  const messages = (await messageLoaders[locale]()).default as typeof enMessages;

  return { locale, messages };
});
