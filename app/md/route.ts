import { shopConfig } from "@/lib/config";
import { escapeMarkdown, markdownFrontmatter } from "@/lib/markdown";
import { markdownHeaders } from "@/lib/markdown/representation";

export function GET(): Response {
  const { description, name, url } = shopConfig.site;

  return new Response(
    `${markdownFrontmatter({ canonicalUrl: new URL("/", url).toString(), description, title: name })}

# ${escapeMarkdown(name)}

${escapeMarkdown(description)}

## Browse

- [All products](${url}/collections/all): Browse the complete catalog.
- [Search](${url}/search): Search products by keyword.
- [Collections](${url}/collections): Browse products by collection.

## Agent resources

- [Storefront guide](${url}/llms.txt): When and how to use this storefront.
- [UCP profile](${url}/.well-known/ucp): Live catalog search, availability, cart, and checkout.
- [Sitemap](${url}/sitemap.xml): Complete index of storefront content.

---

*Locale: ${shopConfig.localization.locale}*`,
    {
      headers: markdownHeaders({
        cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        pathname: "/",
      }),
    },
  );
}
