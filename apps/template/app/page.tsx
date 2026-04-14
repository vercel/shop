import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { HeroSection } from "@/components/hero-section";
import { ProductsCarousel } from "@/components/product/products-carousel";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getProducts } from "@/lib/shopify/operations/products";

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
  const featuredProductsResult = await getProducts({ limit: 10, locale });

  return (
    <>
      <HeroSection
        hero={{
          id: "homepage-hero",
          headline: "Agentic Infrastructure for Commerce",
          subheadline:
            "A production-ready, agent-friendly Shopify storefront built on Next.js.",
          ctaText: "Browse the Catalog",
          ctaLink: "/search",
          backgroundImage: {
            url: "/hero.jpg",
            alt: "Hero background",
            width: 1920,
            height: 1080,
          },
        }}
      />

      <Container>
        <div className="flex flex-col gap-12">
          {featuredProductsResult.products.length > 0 && (
            <ProductsCarousel
              title="Featured products"
              products={featuredProductsResult.products}
              locale={locale}
            />
          )}
        </div>
      </Container>
    </>
  );
}
