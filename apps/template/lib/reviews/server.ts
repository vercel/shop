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
  score: z.number().min(3).max(5).describe("Whole-star rating from 3 to 5"),
  name: z.string().describe("First name + last initial, e.g. 'Sarah K.'"),
  text: z.string().describe("Review body, 120-140 characters, tone matching the score"),
});

const ReviewSnippetsSchema = z.object({
  reviews: z.array(ReviewSnippetSchema),
});

export async function getProductReviewSnippets(
  handle: string,
  title: string,
  description: string,
): Promise<ProductReviewSnippet[]> {
  "use cache: remote";
  // 24h revalidate (not "max"): if the AI call fails during a build with no
  // gateway access, we cache `[]` for that day rather than poisoning the
  // per-handle cache permanently.
  cacheLife("days");
  cacheTag(`product-review-snippets-${handle}`);

  try {
    const { output } = await generateText({
      model: "openai/gpt-5.4-nano",
      output: Output.object({ schema: ReviewSnippetsSchema }),
      prompt: [
        `Write 3 distinct customer reviews for the product below.`,
        `Each review needs a whole-star score from 3 to 5, a reviewer name as "First L." (first name + last initial), and a body of roughly 120–140 characters whose tone matches the score (5 is enthusiastic, 4 is positive with a small caveat, 3 is mixed).`,
        `Keep voices varied. Do not use emojis. Do not mention shipping, packaging, or refunds.`,
        ``,
        `Product: ${title}`,
        `Handle: ${handle}`,
        `Description: ${description}`,
      ].join("\n"),
    });

    return output.reviews.slice(0, 3).map((r) => ({
      score: Math.max(3, Math.min(5, Math.round(r.score))),
      name: r.name,
      text: r.text,
    }));
  } catch {
    return [];
  }
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
