import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import type { ProductCardAspectRatio } from "@/components/product-card/components";
import { ProductsSlider } from "@/components/product/products-slider";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getProductRecommendations } from "@/lib/shopify/operations/products";
import { cn } from "@/lib/utils";

const skeletonAspectRatioClasses =
  "data-[aspect-ratio=landscape]:aspect-[4/3] data-[aspect-ratio=portrait]:aspect-[3/4] data-[aspect-ratio=square]:aspect-square";

export function RelatedProductsSectionSkeleton({
  title,
  aspectRatio = "square",
}: {
  title?: string;
  aspectRatio?: ProductCardAspectRatio;
}) {
  return (
    <div className="overflow-x-clip">
      <div className="mx-auto min-w-0 grid gap-4">
        {title ? (
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tighter">
            {title}
          </h2>
        ) : (
          <Skeleton className="h-7 w-48 rounded-none sm:h-9" />
        )}
        <div className="grid grid-flow-col gap-5 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none auto-cols-[58.33vw] px-5 sm:left-auto sm:right-auto sm:mx-0 sm:w-full sm:max-w-full sm:auto-cols-[calc((100%-1rem)/2)] sm:px-0 lg:auto-cols-[calc((100%-2rem)/3)] xl:auto-cols-[calc((100%-3rem)/4)]">
          {["a", "b", "c", "d"].map((key) => (
            <div key={key}>
              <Skeleton
                data-aspect-ratio={aspectRatio}
                className={cn("rounded-none", skeletonAspectRatioClasses)}
              />
              <div className="py-2.5 h-18 box-content grid gap-2">
                <Skeleton className="h-4 w-full rounded-none" />
                <Skeleton className="h-4 w-3/4 rounded-none" />
                <Skeleton className="h-4 w-16 rounded-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function Render({ handle, locale }: { handle: string; locale: Locale }) {
  await connection();
  const [t, recommendations] = await Promise.all([
    getTranslations("product"),
    getProductRecommendations(handle, locale),
  ]);

  if (recommendations.length === 0) return null;

  return <ProductsSlider title={t("recommendations")} products={recommendations} locale={locale} />;
}

export async function RelatedProductsSection({
  handle,
  locale,
}: {
  handle: string;
  locale: Locale;
}) {
  const t = await getTranslations("product");
  return (
    <Suspense fallback={<RelatedProductsSectionSkeleton title={t("recommendations")} />}>
      <Render handle={handle} locale={locale} />
    </Suspense>
  );
}
