import "server-only";
import { generateObject } from "ai";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import type { ProductReview } from "@/lib/types";

const REVIEWS_MODEL = "google/gemini-3.5-flash";

const reviewSchema = z.object({
  reviews: z
    .array(
      z.object({
        author: z.string().describe("A plausible first and last name."),
        body: z.string().describe("One or two sentences of specific, authentic-sounding praise."),
        date: z.string().describe("A month and year, e.g. 'March 2026'."),
        id: z.string().describe("A short unique identifier."),
        rating: z.number().int().min(3).max(5).describe("A star rating from 3 to 5."),
      }),
    )
    .length(3),
});

// EXPERIMENT: artificial delay to confirm the reviews section streams in behind its
// Suspense boundary instead of blocking the PDP shell. Only fires on a cache miss.
const EXPERIMENT_DELAY_MS = 10_000;

export async function getProductReviews(params: {
  handle: string;
  locale?: string;
  title: string;
}): Promise<ProductReview[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `reviews-${params.handle}`);

  await new Promise((resolve) => setTimeout(resolve, EXPERIMENT_DELAY_MS));

  const { object } = await generateObject({
    model: REVIEWS_MODEL,
    prompt:
      `Write three realistic customer reviews for the product "${params.title}". ` +
      "Each review must have a distinct author, a short body praising a specific detail, " +
      "a month-and-year date, and a star rating between 3 and 5. Keep them varied and authentic.",
    schema: reviewSchema,
  });

  return object.reviews;
}
