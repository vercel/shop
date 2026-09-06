import { formatMoney } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import { markdownHeaders } from "@/lib/markdown/headers";
import { escapeMarkdown } from "@/lib/markdown/utils";
import { searchIndexProducts } from "@/lib/shopify/operations/products";

export async function GET(): Promise<Response> {
  try {
    const { name, url } = shopConfig.site;
    const { locale } = shopConfig.localization;
    const { products } = await searchIndexProducts({ limit: 8 });
    const productLinks = products.map(
      (product) =>
        `- [${escapeMarkdown(product.title)}](${url}/products/${product.handle}): ${formatMoney(product.price, { locale }).localizedString}${product.availableForSale ? "" : " — unavailable"}`,
    );

    return new Response(
      `# ${escapeMarkdown(name)}

Agentic Infrastructure for Commerce. An agent-friendly Shopify storefront built with Next.js and Hydrogen.

## Browse

- [All products](${url}/collections/all): Browse the complete catalog.
- [Search](${url}/search): Search products by keyword.
- [Collections](${url}/collections): Browse products by collection.
${productLinks.length > 0 ? `\n## Featured products\n\n${productLinks.join("\n")}\n` : ""}
## Agent resources

- [Storefront guide](${url}/llms.txt): When and how to use this storefront.
- [Sitemap](${url}/sitemap.xml): Complete index of storefront content.

---

*Locale: ${locale}*`,
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
