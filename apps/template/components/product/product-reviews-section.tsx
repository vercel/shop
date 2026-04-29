import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { ProductRating } from "@/components/product-detail/product-rating";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getProductReviewSnippets, type ProductReviewSnippet } from "@/lib/reviews/server";

export function ProductReviewsSectionSkeleton({ title }: { title?: string }) {
  return (
    <div className="grid gap-4">
      {title ? (
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tighter">
          {title}
        </h2>
      ) : (
        <Skeleton className="h-7 w-48 rounded-none sm:h-9" />
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        {["a", "b", "c"].map((key) => (
          <div key={key} className="grid gap-2.5">
            <Skeleton className="h-4 w-20 rounded-none" />
            <Skeleton className="h-3 w-24 rounded-none" />
            <Skeleton className="h-16 w-full rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function Render({
  handle,
  title,
  description,
  locale,
}: {
  handle: string;
  title: string;
  description: string;
  locale: Locale;
}) {
  await connection();
  const [t, reviews] = await Promise.all([
    getTranslations("product"),
    getProductReviewSnippets(handle, title, description),
  ]);

  if (reviews.length === 0) return null;

  return (
    <div className="grid gap-4">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tighter">
        {t("reviews.title")}
      </h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {reviews.map((review) => (
          <ReviewCard
            key={`${review.name}-${review.text.slice(0, 16)}`}
            review={review}
            ariaLabel={t("rating.ariaLabel", {
              rating: review.score.toFixed(1),
              count: 1,
            })}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  ariaLabel,
  locale,
}: {
  review: ProductReviewSnippet;
  ariaLabel: string;
  locale: Locale;
}) {
  return (
    <article className="grid gap-2.5">
      <ProductRating rating={review.score} ariaLabel={ariaLabel} locale={locale} />
      <p className="text-sm font-medium text-foreground">{review.name}</p>
      <p className="text-sm text-muted-foreground leading-5">{review.text}</p>
    </article>
  );
}

export async function ProductReviewsSection({
  handle,
  title,
  description,
  locale,
}: {
  handle: string;
  title: string;
  description: string;
  locale: Locale;
}) {
  const t = await getTranslations("product");
  return (
    <Suspense fallback={<ProductReviewsSectionSkeleton title={t("reviews.title")} />}>
      <Render handle={handle} title={title} description={description} locale={locale} />
    </Suspense>
  );
}
