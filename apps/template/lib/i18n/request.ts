import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { getLocale } from "../params";
import type enMessages from "./messages/en.json";
import { routing } from "./routing";

const messageLoaders: Record<string, () => Promise<{ default: typeof enMessages }>> = {
  "en-US": () => import("./messages/en.json"),
};

export default getRequestConfig(async () => {
  const requested = await getLocale();
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const loader = messageLoaders[locale] ?? messageLoaders[routing.defaultLocale];
  const messages = (await loader()).default as typeof enMessages;

  return { locale, messages };
});
