import type { Metadata } from "next";

import { ProductsGrid } from "@/components/product/products-grid";
import { BannerSection } from "@/components/sections/banner-section";
import { Container } from "@/components/ui/container";
import { Sections } from "@/components/ui/sections";
import { siteConfig } from "@/lib/config";
import { t } from "@/lib/i18n/server";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getProducts } from "@/lib/shopify/operations/products";

export async function generateMetadata(): Promise<Metadata> {
  const [title, description] = await Promise.all([t("seo.homeTitle"), t("seo.homeDescription")]);

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
  const [locale, featuredProductsTitle] = await Promise.all([
    getLocale(),
    t("content.homepage.featuredProducts.title"),
  ]);
  const featuredProductsResult = await getProducts({ limit: 8, locale });

  return (
    <Sections>
      {/* To use a custom hero image, pass a backgroundImage prop:
          backgroundImage: { url: "https://...", alt: "...", width: 1920, height: 1080 }
          or import a local image: import myHero from "@/public/my-hero.jpg" */}
      <BannerSection
        hero={{
          id: "homepage-hero",
          headline: "Agentic Infrastructure for Commerce",
          subheadline: "A production-ready, agent-friendly Shopify storefront built on Next.js.",
          ctaText: "Browse the Catalog",
          ctaLink: "/search",
        }}
      />

      <Container className="pb-10">
        {featuredProductsResult.products.length > 0 && (
          <ProductsGrid
            title={featuredProductsTitle}
            products={featuredProductsResult.products}
            locale={locale}
            collectionUrl="/search"
          />
        )}
      </Container>
    </Sections>
  );
}
