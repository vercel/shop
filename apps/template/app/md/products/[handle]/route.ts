import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { productToMarkdown } from "@/lib/markdown/product";
import { getProductWithVariants } from "@/lib/shopify/operations/products";

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") || defaultLocale);

  try {
    const product = await getProductWithVariants({ handle, locale });

    if (!product) {
      return new Response(
        `# Product Not Found\n\nThe product with handle \`${handle}\` could not be found.`,
        {
          status: 404,
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=604800",
            Vary: "Accept",
            "X-Robots-Tag": "noindex",
          },
        },
      );
    }

    const markdown = productToMarkdown(product, locale);

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        Vary: "Accept",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return new Response(
      `# Server Error\n\nAn error occurred while retrieving the product. Please try again later.`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Vary: "Accept",
          "X-Robots-Tag": "noindex",
        },
      },
    );
  }
}
