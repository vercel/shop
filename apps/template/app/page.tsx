import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { searchIndexProducts } from "@/lib/shopify/operations/products";
import { shopConfig } from "@/shop.config";

const WALL_SIZE = 40;
const GRID_CLASS = "grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-8";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  const title = t("homeTitle");
  const description = t("homeDescription");

  return {
    title: `${title} | ${shopConfig.site.name}`,
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
  return (
    <Page>
      <Container>
        <Suspense fallback={<ProductWallSkeleton />}>
          <ProductWall />
        </Suspense>
      </Container>
    </Page>
  );
}

function ProductWallSkeleton() {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: WALL_SIZE }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

async function ProductWall() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("product")]);
  const { products } = await searchIndexProducts({ limit: WALL_SIZE, locale });

  if (products.length === 0) return null;

  return (
    <div className={GRID_CLASS}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          outOfStockText={t("outOfStock")}
        />
      ))}
    </div>
  );
}
