import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import type { Locale } from "@/lib/i18n";
import { getProducts } from "@/lib/shopify/operations/products";
import { cn } from "@/lib/utils";

interface ProductsGridSkeletonProps {
  count: number;
  className?: string;
}

export function ProductsGridSkeleton({ count, className }: ProductsGridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface FeaturedProductsProps {
  title: string;
  limit: number;
  locale: Locale;
  collectionUrl?: string;
}

export async function FeaturedProducts({
  title,
  limit,
  locale,
  collectionUrl,
}: FeaturedProductsProps) {
  const t = await getTranslations("product");

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter">{title}</h2>
        {collectionUrl && (
          <Link
            href={collectionUrl}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("viewAll")}
          </Link>
        )}
      </div>
      <Suspense fallback={<ProductsGridSkeleton count={limit} />}>
        <FeaturedProductsGrid limit={limit} locale={locale} outOfStockText={t("outOfStock")} />
      </Suspense>
    </div>
  );
}

async function FeaturedProductsGrid({
  limit,
  locale,
  outOfStockText,
}: {
  limit: number;
  locale: Locale;
  outOfStockText: string;
}) {
  const { products } = await getProducts({ limit, locale });

  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          outOfStockText={outOfStockText}
        />
      ))}
    </div>
  );
}
