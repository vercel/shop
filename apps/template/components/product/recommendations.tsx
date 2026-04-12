import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getProductRecommendations } from "@/lib/shopify/operations/products";

import { RecommendationsCarousel } from "./recommendations-carousel";

function Fallback() {
  return (
    <div className="overflow-x-clip py-4">
      <div className="mx-auto min-w-0">
        <Skeleton className="h-9 w-64 mb-4" />
        <div className="grid grid-flow-col auto-cols-[calc((100%-1rem)/2)] lg:auto-cols-[calc((100%-2rem)/3)] xl:auto-cols-[calc((100%-3rem)/4)] gap-4">
          {["a", "b", "c", "d"].map((key) => (
            <div key={key}>
              <div className="pt-1.5 px-1.5">
                <Skeleton className="aspect-square" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-16 mt-2" />
                </div>
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
    <RecommendationsCarousel
      title={t("recommendations")}
      products={recommendations}
      locale={locale}
    />
  );
}

export async function Recommendations({ handle, locale }: { handle: string; locale: Locale }) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render handle={handle} locale={locale} />
    </Suspense>
  );
}
