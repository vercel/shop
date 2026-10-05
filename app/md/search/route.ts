import { markdownHeaders } from "@/lib/markdown/representation";
import { searchToMarkdown } from "@/lib/markdown/search";

export function GET(request: Request): Response {
  const query = new URL(request.url).searchParams.get("q") ?? undefined;
  return new Response(searchToMarkdown(query), {
    headers: markdownHeaders({
      cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
      pathname: "/search",
    }),
  });
}
