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
  const [contentT, productT, collections, featuredProductsResult] = await Promise.all([
    getTranslations("content.homepage"),
    getTranslations("product"),
    getCollections(locale),
    getProducts({ limit: 10, locale }),
  ]);

  const featuredCollection =
    collections.find((collection) => collection.handle === FEATURED_COLLECTION_HANDLE) ??
    collections[0];

  return (
    <Container>
      <div className="flex flex-col gap-8 pb-16">
        <HeroSection
          hero={{
            id: "homepage-hero",
            headline: contentT("hero.headline", {
              storeName: siteConfig.name,
            }),
            subheadline: contentT("hero.subheadline"),
            ctaText: contentT("hero.ctaText"),
            ctaLink: featuredCollection ? `/collections/${featuredCollection.handle}` : "/search",
          }}
        />

        <section className="py-10">
          <div className="border-t border-border/40 pt-8">
            <div className="grid items-start gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
              <h2 className="text-3xl font-semibold tracking-tight">{contentT("intro.title")}</h2>
              <div className="max-w-2xl text-base leading-7 text-muted-foreground">
                <p>{contentT("intro.paragraphOne")}</p>
                <p className="mt-4">{contentT("intro.paragraphTwo")}</p>
              </div>
            </div>
          </div>
        </section>

        {featuredCollection && (
          <Suspense fallback={<CollectionGridSkeleton />}>
            <CollectionProductGrid
              handle={featuredCollection.handle}
              title={contentT("featuredCollection.title", {
                collectionTitle: featuredCollection.title,
              })}
              locale={locale}
              outOfStockText={productT("outOfStock")}
            />
          </Suspense>
        )}

        {featuredProductsResult.products.length > 0 && (
          <TopProductsCarousel
            title={contentT("featuredProducts.title")}
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
    <section className="py-12">
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
    <section className="py-12">
      <Skeleton className="mb-8 h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((slot) => (
          <Skeleton key={`product-skeleton-${slot}`} className="aspect-square rounded-lg" />
        ))}
      </div>
    </section>
  );
}
