import { getCollections } from "@/lib/collections/server";
import { shopConfig } from "@/lib/config";
import { summarizeText } from "@/lib/content";
import { escapeMarkdown } from "@/lib/markdown";
import { getShopPolicies } from "@/lib/policies/server";

export async function GET(): Promise<Response> {
  const { description, name, url } = shopConfig.site;
  const { country, language } = shopConfig.localization;
  const [collections, policies] = await Promise.all([
    getCollections({ limit: 50 }).catch(() => []),
    getShopPolicies().catch(() => []),
  ]);
  const collectionLinks = collections.map((collection) => {
    const link = `[${escapeMarkdown(collection.title)}](${url}${collection.path})`;
    const summary = summarizeText(collection.description);
    return summary ? `- ${link}: ${escapeMarkdown(summary)}` : `- ${link}`;
  });
  const policyLinks = policies.map(
    (policy) => `- [${escapeMarkdown(policy.title)}](${url}/policies/${policy.handle})`,
  );

  return new Response(
    `# ${escapeMarkdown(name)}

> ${escapeMarkdown(summarizeText(description))}

Home, product, collection, and search pages return Markdown with an \`Accept: text/markdown\` header or at the page URL with \`.md\` appended (\`/index.md\` for the home page). Prices and availability use Shopify country \`${country}\` and language \`${language}\`.

## Buy for a shopper

Catalog search, live availability, carts, and checkout come from Shopify through the Universal Commerce Protocol (UCP).

- [UCP profile](${url}/.well-known/ucp): Supported UCP versions, capabilities, and payment handlers.
- UCP MCP endpoint: \`POST ${url}/api/ucp/mcp\` with JSON-RPC; call \`tools/list\` for tools and schemas.

1. Find products with \`search_catalog\`, then get exact pricing, variants, and real-time availability with \`get_product\` or \`lookup_catalog\`.
2. Build a cart with \`create_cart\` and \`update_cart\`.
3. Create a checkout with \`create_checkout\`, then set the shipping address and method with \`update_checkout\`.
4. Call \`complete_checkout\` only after the shopper explicitly approves the payment.
5. Track the order with \`get_order\`.

Every call requires \`meta.ucp-agent.profile\`, your agent's UCP profile URL. Pass the shopper's \`address_country\` and \`currency\` in \`context\` for accurate prices and availability. Back off when the endpoint returns \`429\`.

## Policies

${[
  ...policyLinks,
  `- Policy and FAQ search: MCP tool \`search_shop_policies_and_faqs\` at \`POST ${url}/api/mcp\` answers questions about shipping, returns, and contacting the store.`,
].join("\n")}

## Browse

- [All products](${url}/collections/all): The full product catalog.
${collectionLinks.length > 0 ? `\n## Collections\n\n${collectionLinks.join("\n")}\n` : ""}
## Discovery

- [Sitemap](${url}/sitemap.xml): Complete index of product and collection URLs.
- [Robots](${url}/robots.txt): Crawl policy.
`,
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
