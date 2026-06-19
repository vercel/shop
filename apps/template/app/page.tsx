import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { HomeView, HomeViewFallback } from "@/components/storefront/home-view";
import { siteConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getCatalogProducts } from "@/lib/shopify/operations/products";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  const title = t("homeTitle");
  const description = t("homeDescription");

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    alternates: buildAlternates({ pathname: "/" }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/",
      type: "website",
    }),
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const products = getCatalogProducts({ limit: 8, locale }).then((result) => result.products);

  return (
    <Suspense fallback={<HomeViewFallback locale={locale} />}>
      <HomeView locale={locale} products={products} />
    </Suspense>
  );
}
