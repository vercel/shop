import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getProductRecommendations } from "@/lib/shopify/operations/products";

import { ProductsCarousel } from "@/components/product/products-carousel";

function Fallback({ title }: { title: string }) {
  return (
    <div className="overflow-x-clip py-4">
      <div className="mx-auto min-w-0">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter mb-4">{title}</h2>
        <div className="grid grid-flow-col gap-4 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none auto-cols-[58.33vw] px-4 sm:left-auto sm:right-auto sm:mx-0 sm:w-full sm:max-w-full sm:auto-cols-[calc((100%-1rem)/2)] sm:px-0 lg:auto-cols-[calc((100%-2rem)/3)] xl:auto-cols-[calc((100%-3rem)/4)]">
          {["a", "b", "c", "d"].map((key) => (
            <div key={key}>
              <Skeleton className="aspect-square" />
              <div className="py-3 h-18 box-content">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-4 w-16 mt-2" />
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

  return (
    <ProductsCarousel
      title={t("recommendations")}
      products={recommendations}
      locale={locale}
    />
  );
}

export async function Recommendations({ handle, locale }: { handle: string; locale: Locale }) {
  const t = await getTranslations("product");
  return (
    <Suspense fallback={<Fallback title={t("recommendations")} />}>
      <Render handle={handle} locale={locale} />
    </Suspense>
  );
}
