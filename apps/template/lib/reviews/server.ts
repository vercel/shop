import "server-only";
import { generateText, Output } from "ai";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import type { ProductReviews } from "@/lib/types";

export interface ProductReviewSnippet {
  score: number;
  name: string;
  text: string;
}

const ReviewSnippetSchema = z.object({
  score: z.number().int().min(3).max(5).describe("Whole-star rating from 3 to 5"),
  name: z.string().describe("First name + last initial, e.g. 'Sarah K.'"),
  text: z
    .string()
    .min(120)
    .max(140)
    .describe("Review body, 120-140 characters, tone matching the score"),
});

const ReviewSnippetsSchema = z.object({
  reviews: z.array(ReviewSnippetSchema).length(3),
});

export async function getProductReviewSnippets(
  handle: string,
  title: string,
  description: string,
): Promise<ProductReviewSnippet[]> {
  "use cache";
  cacheLife("max");
  cacheTag(`product-review-snippets-${handle}`);

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: ReviewSnippetsSchema }),
    prompt: [
      `Write 3 distinct customer reviews for the product below.`,
      `Each review needs a whole-star score from 3 to 5, a reviewer name as "First L." (first name + last initial), and a 120–140 character body whose tone matches the score (5 is enthusiastic, 4 is positive with a small caveat, 3 is mixed).`,
      `Keep voices varied. Do not use emojis. Do not mention shipping, packaging, or refunds.`,
      ``,
      `Product: ${title}`,
      `Handle: ${handle}`,
      `Description: ${description}`,
    ].join("\n"),
  });

  return output.reviews;
}

export async function getProductReviews(handle: string): Promise<ProductReviews> {
  "use cache";
  cacheLife("max");
  cacheTag(`product-reviews-${handle}`);

  const seed = hashHandle(handle);
  const rating = 3 + (seed % 2001) / 1000;
  const count = 12 + ((seed >>> 4) % 2488);

  return {
    rating: Math.round(rating * 100) / 100,
    count,
  };
}

function hashHandle(handle: string): number {
  let hash = 2166136261;
  for (let i = 0; i < handle.length; i++) {
    hash ^= handle.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
