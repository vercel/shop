import { connection } from "next/server";
import { Suspense } from "react";

import { ProductsCarousel } from "@/components/product/products-carousel";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n/server";
import { getProductRecommendations } from "@/lib/shopify/operations/products";

function Fallback({ title }: { title: string }) {
  return (
    <div className="overflow-x-clip py-5">
      <div className="mx-auto min-w-0 grid gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter">{title}</h2>
        <div className="grid grid-flow-col gap-5 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none auto-cols-[58.33vw] px-5 sm:left-auto sm:right-auto sm:mx-0 sm:w-full sm:max-w-full sm:auto-cols-[calc((100%-1rem)/2)] sm:px-0 lg:auto-cols-[calc((100%-2rem)/3)] xl:auto-cols-[calc((100%-3rem)/4)]">
          {["a", "b", "c", "d"].map((key) => (
            <div key={key}>
              <Skeleton className="aspect-square" />
              <div className="py-2.5 h-18 box-content grid gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-16" />
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
  const [title, recommendations] = await Promise.all([
    t("product.recommendations"),
    getProductRecommendations(handle, locale),
  ]);

  if (recommendations.length === 0) return null;

  return <ProductsCarousel title={title} products={recommendations} locale={locale} />;
}

export async function RelatedProductsSection({
  handle,
  locale,
}: {
  handle: string;
  locale: Locale;
}) {
  const title = await t("product.recommendations");
  return (
    <Suspense fallback={<Fallback title={title} />}>
      <Render handle={handle} locale={locale} />
    </Suspense>
  );
}
