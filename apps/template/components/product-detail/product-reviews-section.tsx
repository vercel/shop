import { getTranslations } from "next-intl/server";
import { io } from "next/cache";
import { Suspense } from "react";

import { RatingStars } from "@/components/ui/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getProductReviews } from "@/lib/reviews/server";

const REVIEW_COUNT = 3;

function ProductReviewsSkeleton({ title }: { title: string }) {
  return (
    <div className="grid gap-5" data-slot="product-reviews">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <div className="grid gap-5">
        {Array.from({ length: REVIEW_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

async function Render({
  handle,
  locale,
  title,
}: {
  handle: string | Promise<string>;
  locale: Locale;
  title: string;
}) {
  // io() suspends the prerender at this boundary so the skeleton ships in the static
  // shell and the reviews stream in at request time. It's a no-op inside a use cache
  // scope, so it must live here (outside getProductReviews), not in the cached fetch.
  await io();
  const resolvedHandle = await handle;
  const [t, reviews] = await Promise.all([
    getTranslations("product"),
    getProductReviews({ handle: resolvedHandle, locale, title }),
  ]);

  if (reviews.length === 0) return null;

  return (
    <div className="grid gap-5" data-slot="product-reviews">
      <h2 className="text-2xl sm:text-3xl">{t("reviewsTitle")}</h2>
      <div className="grid gap-5">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="grid gap-2.5 border-b border-border pb-5 last:border-b-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1.5">
                <span className="font-medium text-sm">{review.author}</span>
                <RatingStars
                  value={review.rating}
                  label={t("ratingLabel", { max: 5, rating: review.rating })}
                />
              </div>
              <span className="shrink-0 text-muted-foreground text-sm">{review.date}</span>
            </div>
            <p className="text-foreground/70 text-sm leading-relaxed lg:max-w-1/2">{review.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export async function ProductReviewsSection({
  handle,
  locale,
  title,
}: {
  handle: string | Promise<string>;
  locale: Locale;
  title: string;
}) {
  const t = await getTranslations("product");

  return (
    <Suspense fallback={<ProductReviewsSkeleton title={t("reviewsTitle")} />}>
      <Render handle={handle} locale={locale} title={title} />
    </Suspense>
  );
}
