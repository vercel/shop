import { llmsTxt } from "@/lib/markdown/llms";
import { getCollections } from "@/lib/shopify/operations/collections";

export async function GET(request: Request): Promise<Response> {
  const collections = await getCollections({
    limit: 50,
  }).catch(() => []);
  return new Response(
    llmsTxt({
      collections,
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
