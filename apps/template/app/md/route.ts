import { markdownHeaders } from "@/lib/markdown/headers";
import { homeToMarkdown } from "@/lib/markdown/home";
import { searchIndexProducts } from "@/lib/shopify/operations/products";

export async function GET(request: Request): Promise<Response> {
  try {
    const result = await searchIndexProducts({
      limit: 8,
    });
    return new Response(
      homeToMarkdown({
        description: `${"Agentic Infrastructure for Commerce"}. ${"An agent-friendly Shopify storefront built with Next.js and Hydrogen."}`,
        products: result.products,
      }),
      {
        headers: markdownHeaders({
          cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
          pathname: "/",
        }),
      },
    );
  } catch {
    return new Response(
      "# Server Error\n\nThe storefront could not be retrieved. Try again later.",
      {
        status: 500,
        headers: markdownHeaders({
          cacheControl: "no-cache, no-store, must-revalidate",
          pathname: "/",
        }),
      },
    );
  }
}
