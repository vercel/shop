import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FeaturedProducts } from "@/components/product/products-grid";
import { BannerSection } from "@/components/sections/banner-section";
import { Container } from "@/components/ui/container";
import { Sections } from "@/components/ui/sections";
import { siteConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

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
  const [locale, t] = await Promise.all([getLocale(), getTranslations("content.homepage")]);

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
        <FeaturedProducts
          title={t("featuredProducts.title")}
          limit={8}
          locale={locale}
          collectionUrl="/search"
        />
      </Container>
    </Sections>
  );
}
