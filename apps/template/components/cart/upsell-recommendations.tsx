import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProductsCarousel } from "@/components/cms/blocks/top-products-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getProductRecommendations } from "@/lib/shopify/operations/products";

interface UpsellsProps {
  locale: Locale;
  firstItemHandle?: string;
}

async function UpsellsContent({ locale, firstItemHandle }: UpsellsProps) {
  const t = await getTranslations("cart.upsell");

  if (!firstItemHandle) {
    return null;
  }

  // Fetch product recommendations based on first cart item
  const products = await getProductRecommendations(firstItemHandle, locale);

  const recommendations = products.filter((product) => product.featuredImage?.url);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-12 border-t border-border">
      <ProductsCarousel title={t("title")} products={recommendations} locale={locale} />
    </section>
  );
}

export function Upsells({ locale, firstItemHandle }: UpsellsProps) {
  return (
    <Suspense
      fallback={
        <div className="mt-12 pt-12 border-t border-border">
          <div className="overflow-x-clip py-4">
            <div className="mx-auto min-w-0">
              <Skeleton className="h-9 w-48 mb-4" />
              <div className="grid grid-flow-col gap-4 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none auto-cols-[58.33vw] px-4 sm:left-auto sm:right-auto sm:mx-0 sm:w-full sm:max-w-full sm:auto-cols-[calc((100%-1rem)/2)] sm:px-0 lg:auto-cols-[calc((100%-2rem)/3)]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-80 bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <UpsellsContent locale={locale} firstItemHandle={firstItemHandle} />
    </Suspense>
  );
}
