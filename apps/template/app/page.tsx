import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { TopProductsCarousel } from "@/components/cms/blocks/top-products-carousel";
import { HeroSection } from "@/components/cms/hero-section";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getCollections } from "@/lib/shopify/operations/collections";
import { getCollectionProducts, getProducts } from "@/lib/shopify/operations/products";

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

const FEATURED_COLLECTION_HANDLE = "furniture";

export default async function HomePage() {
  const locale = await getLocale();
  const [collections, featuredProductsResult] = await Promise.all([
    getCollections(locale),
    getProducts({ limit: 10, locale }),
  ]);

  const featuredCollection =
    collections.find((collection) => collection.handle === FEATURED_COLLECTION_HANDLE) ??
    collections[0];

  return (
    <Container>
      <div className="flex flex-col gap-16 pb-16">
        <HeroSection
          hero={{
            id: "homepage-hero",
            headline: `Start selling with ${siteConfig.name}`,
            subheadline: "A clean Shopify storefront you can shape as you go.",
            ctaText: "Browse the catalog",
            ctaLink: featuredCollection ? `/collections/${featuredCollection.handle}` : "/search",
          }}
        />

        <section>
          <div className="grid items-start gap-6 md:grid-cols-2 lg:gap-12">
            <h2 className="text-3xl font-semibold tracking-tight">Built to launch first, customize later</h2>
            <div className="prose prose-neutral max-w-2xl">
              <p>
                This is a production-ready Shopify storefront built with Next.js. It connects to
                your Shopify store out of the box, giving you product pages, collections, cart
                functionality, and search — everything you need to start selling.
              </p>
              <p>
                Every part of this template is yours to change. Update the layout, swap components,
                adjust the styling, or wire in a CMS — the code is designed to be read and modified,
                not worked around.
              </p>
            </div>
          </div>
        </section>

        {featuredCollection && (
          <Suspense fallback={<CollectionGridSkeleton />}>
            <CollectionProductGrid
              handle={featuredCollection.handle}
              title={`From ${featuredCollection.title}`}
              locale={locale}
              outOfStockText="Out of Stock"
            />
          </Suspense>
        )}

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

async function CollectionProductGrid({
  handle,
  title,
  locale,
  outOfStockText,
}: {
  handle: string;
  title: string;
  locale: Locale;
  outOfStockText: string;
}) {
  const result = await getCollectionProducts({
    collection: handle,
    limit: 8,
    locale,
  });

  if (result.products.length === 0) return null;

  return (
    <section>
      <h2 className="mb-8 text-3xl font-semibold tracking-tight">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {result.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            outOfStockText={outOfStockText}
          />
        ))}
      </div>
    </section>
  );
}

function CollectionGridSkeleton() {
  return (
    <section>
      <Skeleton className="mb-8 h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((slot) => (
          <Skeleton key={`product-skeleton-${slot}`} className="aspect-square rounded-lg" />
        ))}
      </div>
    </section>
  );
}
