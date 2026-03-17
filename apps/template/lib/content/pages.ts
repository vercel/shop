import { defaultLocale, type Locale } from "@/lib/i18n";

import type { MarketingPage } from "@/lib/types";

type LocalMarketingPageBuilder = (locale: Locale) => Promise<MarketingPage>;

const localMarketingPages: Record<string, LocalMarketingPageBuilder> = {};

export function getAllLocalMarketingPageSlugs(): Array<{
  slug: string;
  locale: Locale;
}> {
  return Object.keys(localMarketingPages).map((slug) => ({
    slug,
    locale: defaultLocale,
  }));
}

export async function getLocalMarketingPage(
  slug: string,
  locale: Locale,
): Promise<MarketingPage | null> {
  const buildPage = localMarketingPages[slug];

  if (!buildPage) {
    return null;
  }

  return buildPage(locale);
}
