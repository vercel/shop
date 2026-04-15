import { getRequestConfig } from "next-intl/server";

import { defaultLocale, resolveLocale } from ".";
import type enMessages from "./messages/en.json";

const messageLoaders = {
  "en-US": () => import("./messages/en.json"),
} as const;

export default getRequestConfig(async () => {
  const locale = resolveLocale(defaultLocale);
  const messages = (await messageLoaders[locale]()).default as typeof enMessages;

  return { locale, messages };
});
