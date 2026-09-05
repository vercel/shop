import { formatMoney } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { ProductCard } from "@/lib/types";

import { escapeMarkdown } from "./utils";

export function homeToMarkdown({
  description,
  locale = shopConfig.localization.locale,
  products,
}: {
  description: string;
  locale?: string;
  products: ProductCard[];
}): string {
  const { name, url } = shopConfig.site;
  const sections = [
    `# ${escapeMarkdown(name)}`,
    "",
    escapeMarkdown(description),
    "",
    "## Browse",
    "",
    `- [All products](${url}/collections/all): Browse the complete catalog.`,
    `- [Search](${url}/search): Search products by keyword.`,
    `- [Collections](${url}/collections): Browse products by collection.`,
    "",
  ];

  if (products.length > 0) {
    sections.push("## Featured products", "");
    for (const product of products) {
      sections.push(
        `- [${escapeMarkdown(product.title)}](${url}/products/${product.handle}): ${formatMoney(product.price, { locale }).localizedString}${product.availableForSale ? "" : " — unavailable"}`,
      );
    }
    sections.push("");
  }

  sections.push(
    "## Agent resources",
    "",
    `- [Storefront guide](${url}/llms.txt): When and how to use this storefront.`,
    `- [Sitemap](${url}/sitemap.xml): Complete index of storefront content.`,
    "",
    "---",
    "",
    `*Locale: ${locale}*`,
  );

  return sections.join("\n");
}
