import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getProductRecommendations } from "@/lib/shopify/operations/products";

const RECOMMENDATION_LIMIT = 4;

export function RelatedProductsSectionSkeleton({ title }: { title?: string }) {
  return (
    <div className="grid gap-4">
      {title ? (
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter">{title}</h2>
      ) : (
        <Skeleton className="h-9 w-48" />
      )}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: RECOMMENDATION_LIMIT }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

async function Render({ handle, locale }: { handle: string | Promise<string>; locale: Locale }) {
  const resolvedHandle = await handle;
  const [t, recommendations] = await Promise.all([
    getTranslations("product"),
    getProductRecommendations({ handle: resolvedHandle, locale }),
  ]);

  if (recommendations.length === 0) return null;

  return (
    <div className="grid gap-4">
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter">
        {t("recommendations")}
      </h2>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {recommendations.slice(0, RECOMMENDATION_LIMIT).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            outOfStockText={t("outOfStock")}
          />
        ))}
      </div>
    </div>
  );
}

export async function RelatedProductsSection({
  handle,
  locale,
}: {
  handle: string | Promise<string>;
  locale: Locale;
}) {
  const t = await getTranslations("product");
  return (
    <Suspense fallback={<RelatedProductsSectionSkeleton title={t("recommendations")} />}>
      <Render handle={handle} locale={locale} />
    </Suspense>
  );
}
