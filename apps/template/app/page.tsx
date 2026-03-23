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
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const featuredProductsResult = await getProducts({ limit: 10, locale });

  return (
    <Container>
      <div className="flex flex-col gap-16 pb-16">
        <HeroSection
          hero={{
            id: "homepage-hero",
            headline: `Start selling with ${siteConfig.name}`,
            subheadline: "A clean Shopify storefront you can shape as you go.",
            ctaText: "Browse the catalog",
            ctaLink: "/search",
          }}
        />

        <section>
          <div className="grid items-start gap-4 md:grid-cols-2">
            <h2 className="text-3xl font-semibold tracking-tight">Built to launch first, customize later</h2>
            <div className="prose prose-neutral max-w-2xl">
              <p>
                A Shopify storefront built with Next.js. Connect your store and you get product
                pages, collections, a cart, and search. It works out of the box, and every part
                of it is yours to change.
              </p>
              <p>
                Swap components, restyle things, wire in a CMS. The code is written to be read
                and modified, not worked around.
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
  );
}
