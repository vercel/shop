import { generateText } from "ai";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const SUMMARY_LIMIT = 140;

async function generateSummary(handle: string, title: string, description: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag(`product-summary-${handle}`);

  const { text } = await generateText({
    model: "anthropic/claude-haiku-4.5",
    prompt: `Summarize this product in ${SUMMARY_LIMIT} characters or fewer. Plain prose, no markdown, no quotes.\n\nTitle: ${title}\nDescription: ${description}`,
  });

  return text.trim().slice(0, SUMMARY_LIMIT);
}

async function Render({
  handle,
  title,
  description,
}: {
  handle: string;
  title: string;
  description: string;
}) {
  const summary = await generateSummary(handle, title, description);
  return <p className="text-sm text-muted-foreground">{summary}</p>;
}

export function ProductSummarySection({
  description,
  handle,
  title,
}: {
  description: string;
  handle: string;
  title: string;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-5 w-3/4" />}>
      <Render handle={handle} title={title} description={description} />
    </Suspense>
  );
}
