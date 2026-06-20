import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { llmsTxt } from "@/lib/markdown/llms";
import { getCollections } from "@/lib/shopify/operations/collections";

export async function GET(request: Request): Promise<Response> {
  const locale = resolveLocale(new URL(request.url).searchParams.get("locale") || defaultLocale);

  const collections = await getCollections({ limit: 50, locale }).catch(() => []);

  return new Response(llmsTxt({ collections, locale }), {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
