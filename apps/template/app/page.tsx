import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TopProductsCarousel } from "@/components/cms/blocks/top-products-carousel";
import { HeroSection } from "@/components/cms/hero-section";
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
    title,
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
            "A production-ready Shopify storefront built on Next.js. Extend it with AI agents.",
          ctaText: "Browse the Catalog",
          ctaLink: "/search",
        }}
      />

      <Container>
        <div className="flex flex-col gap-16 pb-16">
          <section>
            <div className="grid items-start gap-4 md:grid-cols-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                Your store, ready in days
              </h2>
              <div className="prose prose-neutral">
                <p>
                  Connect your Shopify store and get product pages, cart, search, and collections
                  out of the box. Add markets, CMS, auth, and more with a single command.
                </p>
                <p>
                  Every component is yours to customize. Optimistic UI, cached responses, and
                  AI-readable product pages are built in from the start.
                </p>
              </div>
            </div>
          </section>

          {featuredProductsResult.products.length > 0 && (
            <TopProductsCarousel
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
