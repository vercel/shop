import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { RatingStars } from "@/components/ui/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";

interface PlaceholderReview {
  author: string;
  body: string;
  date: string;
  id: string;
  rating: number;
}

// Placeholder data standing in for a real reviews integration (Shopify metafields,
// a third-party widget, etc.). Replace this with a fetch when wiring up reviews.
const PLACEHOLDER_REVIEWS: PlaceholderReview[] = [
  {
    author: "Alex Morgan",
    body: "Exceeded my expectations. The quality is outstanding and it arrived earlier than promised. Would absolutely buy again.",
    date: "March 2026",
    id: "1",
    rating: 5,
  },
  {
    author: "Jordan Lee",
    body: "Really happy with this purchase overall. Fit and finish are great — took off one star only because shipping took a little longer than expected.",
    date: "February 2026",
    id: "2",
    rating: 4,
  },
  {
    author: "Sam Rivera",
    body: "Exactly as described and worth every penny. I've already recommended it to a couple of friends.",
    date: "January 2026",
    id: "3",
    rating: 5,
  },
];

export const PLACEHOLDER_REVIEW_SUMMARY = {
  count: PLACEHOLDER_REVIEWS.length,
  value:
    PLACEHOLDER_REVIEWS.reduce((total, review) => total + review.rating, 0) /
    PLACEHOLDER_REVIEWS.length,
};

function ProductReviewsSkeleton({ title }: { title: string }) {
  return (
    <div className="grid gap-5" data-slot="product-reviews">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <div className="grid gap-5">
        {PLACEHOLDER_REVIEWS.map((review) => (
          <Skeleton key={review.id} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

async function Render() {
  const t = await getTranslations("product");

  return (
    <div className="grid gap-5" data-slot="product-reviews">
      <h2 className="text-2xl sm:text-3xl">{t("reviewsTitle")}</h2>
      <div className="grid gap-5">
        {PLACEHOLDER_REVIEWS.map((review) => (
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

export async function ProductReviewsSection() {
  const t = await getTranslations("product");

  return (
    <Suspense fallback={<ProductReviewsSkeleton title={t("reviewsTitle")} />}>
      <Render />
    </Suspense>
  );
}
