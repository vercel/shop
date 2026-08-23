import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { markdownHeaders } from "@/lib/markdown/headers";
import { notFoundMarkdown } from "@/lib/markdown/not-found";
import { productToMarkdown } from "@/lib/markdown/product";
import { getProductWithVariants } from "@/lib/shopify/operations/products";

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") || defaultLocale);
  const pathname = `/products/${handle}`;

  try {
    const product = await getProductWithVariants({ handle, locale });

    if (!product) {
      return new Response(notFoundMarkdown({ kind: "Product", value: handle }), {
        status: 404,
        headers: markdownHeaders({
          cacheControl: "public, max-age=3600, stale-while-revalidate=604800",
          pathname,
        }),
      });
    }

    return new Response(productToMarkdown(product, locale), {
      headers: markdownHeaders({
        cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        pathname,
      }),
    });
  } catch {
    return new Response(
      "# Server Error\n\nAn error occurred while retrieving the product. Please try again later.",
      {
        status: 500,
        headers: markdownHeaders({
          cacheControl: "no-cache, no-store, must-revalidate",
          pathname,
        }),
      },
    );
  }
}
