import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { productToMarkdown } from "@/lib/markdown/product";
import { getProduct } from "@/lib/shopify/operations/products";

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") || defaultLocale);

  try {
    const product = await getProduct(handle, locale);
    const markdown = productToMarkdown(product, locale);

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        Vary: "Accept",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isNotFound = message.includes("Product not found");

    return new Response(
      isNotFound
        ? `# Product Not Found\n\nThe product with handle \`${handle}\` could not be found.`
        : `# Server Error\n\nAn error occurred while retrieving the product. Please try again later.`,
      {
        status: isNotFound ? 404 : 500,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": isNotFound
            ? "public, max-age=3600, stale-while-revalidate=604800"
            : "no-cache, no-store, must-revalidate",
          Vary: "Accept",
          "X-Robots-Tag": "noindex",
        },
      },
    );
  }
}
