import { getCollections } from "@/lib/collections/server";
import { shopConfig } from "@/lib/config";
import { escapeMarkdown } from "@/lib/markdown";

export async function GET(): Promise<Response> {
  const { name, url } = shopConfig.site;
  const collections = await getCollections({ limit: 50 }).catch(() => []);
  const collectionLinks = collections.map((collection) => {
    const link = `[${escapeMarkdown(collection.title)}](${url}${collection.path})`;
    const description = collection.description.replace(/\s+/g, " ").trim();
    const summary =
      description.length > 200 ? `${description.slice(0, 199).trimEnd()}…` : description;
    return summary ? `- ${link}: ${escapeMarkdown(summary)}` : `- ${link}`;
  });

  return new Response(
    `# ${escapeMarkdown(name)}

> Online store. The homepage, product, collection, and search pages serve clean Markdown when fetched with an \`Accept: text/markdown\` header.

## When to use this storefront

Use this storefront to discover, compare, and purchase its products.

- Search when a shopper describes what they need.
- Fetch product and collection URLs as Markdown to compare prices, variants, availability, and product details.
- Use a browser-capable flow for cart and checkout actions.
- Do not treat this storefront as developer documentation or a general-purpose public API.

## Browse

- [All products](${url}/collections/all): The full product catalog.
- [Search](${url}/search): Full-text product search; append \`?q=<query>\`.
${collectionLinks.length > 0 ? `\n## Collections\n\n${collectionLinks.join("\n")}\n` : ""}
## Discovery

- [Sitemap](${url}/sitemap.xml): Complete index of product and collection URLs.
- [Robots](${url}/robots.txt): Crawl policy.

---

*Locale: ${shopConfig.localization.locale}*`,
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
