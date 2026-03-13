import { getRequestConfig } from "next-intl/server";
import { defaultLocale, resolveLocale } from "../i18n";
import type enMessages from "./messages/en.json";

const messageLoaders = {
  "de-DE": () => import("./messages/de-DE.json"),
  "en-GB": () => import("./messages/en.json"),
  "en-US": () => import("./messages/en.json"),
  "es-ES": () => import("./messages/es-ES.json"),
  "fr-FR": () => import("./messages/fr-FR.json"),
  "nl-NL": () => import("./messages/nl-NL.json"),
} as const;

export default getRequestConfig(async () => {
  const locale = resolveLocale(defaultLocale);
  const messages = (await messageLoaders[locale]())
    .default as typeof enMessages;

  return { locale, messages };
});
