import { defineRouting } from "next-intl/routing";

import { defaultLocale, enabledLocales } from ".";

export const routing = defineRouting({
  defaultLocale,
  localePrefix: "always",
  locales: enabledLocales,
});
