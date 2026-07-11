import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { pdp } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import { getRelatedProducts } from "@/lib/shopify/operations/products";

export function RelatedProductsSectionSkeleton({
  limit,
  title,
}: {
  limit: number;
  title?: string;
}) {
  return (
    <div className="grid gap-4">
      {title ? (
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
      ) : (
        <Skeleton className="h-9 w-48" />
      )}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: limit }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

async function Render({
  handle,
  limit,
  locale,
}: {
  handle: string | Promise<string>;
  limit: number;
  locale: Locale;
}) {
  const resolvedHandle = await handle;
  const [t, related] = await Promise.all([
    getTranslations("product"),
    getRelatedProducts({ handle: resolvedHandle, locale }),
  ]);

  if (related.length === 0) return null;

  return (
    <div className="grid gap-4">
      <h2 className="text-2xl sm:text-3xl">{t("recommendations")}</h2>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {related.slice(0, limit).map((product) => (
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
  if (!pdp.relatedProducts.enabled) return null;

  const t = await getTranslations("product");
  const { limit } = pdp.relatedProducts;
  return (
    <Suspense
      fallback={<RelatedProductsSectionSkeleton limit={limit} title={t("recommendations")} />}
    >
      <Render handle={handle} limit={limit} locale={locale} />
    </Suspense>
  );
}
