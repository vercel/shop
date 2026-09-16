import { formatMoney } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import { escapeMarkdown } from "@/lib/markdown";
import type { ProductDetails } from "@/lib/product/types";

const SUMMARY_MAX_LENGTH = 200;

function summarize(product: ProductDetails): string {
  const description = product.description.replace(/\s+/g, " ").trim();
  const seoDescription = product.seo.description.replace(/\s+/g, " ").trim();
  // Shopify defaults the SEO description to the full description; only a distinct one is a real summary.
  if (
    seoDescription &&
    seoDescription !== description &&
    seoDescription.length <= SUMMARY_MAX_LENGTH
  ) {
    return seoDescription;
  }
  const source = seoDescription && seoDescription !== description ? seoDescription : description;
  if (!source) return "";
  const [firstSentence = source] = source.split(/(?<=[.!?])\s+/, 1);
  return firstSentence.length > SUMMARY_MAX_LENGTH
    ? `${firstSentence.slice(0, SUMMARY_MAX_LENGTH - 1).trimEnd()}…`
    : firstSentence;
}

function priceLine(product: ProductDetails, locale: string): string {
  const format = (money: { amount: string; currencyCode: string }) =>
    formatMoney(money, { locale }).localizedString;
  const { maxVariantPrice, minVariantPrice } = product.priceRange;
  const parts: string[] = [];

  if (minVariantPrice.amount === maxVariantPrice.amount) {
    parts.push(`**${format(product.price)}**`);
  } else {
    parts.push(
      `**${format(minVariantPrice)} – ${format(maxVariantPrice)}** across ${product.variantsCount} variants`,
    );
  }

  if (
    product.compareAtPrice &&
    Number.parseFloat(product.compareAtPrice.amount) > Number.parseFloat(product.price.amount)
  ) {
    parts.push(`Was ${format(product.compareAtPrice)}`);
  }

  parts.push(product.availableForSale ? "In stock" : "Sold out");
  return parts.join(" · ");
}

export function productToMarkdown(product: ProductDetails, locale: string): string {
  const sections: string[] = [];
  const siteUrl = shopConfig.site.url;

  sections.push(`# ${escapeMarkdown(product.title)}`, "");

  const attribution: string[] = [];
  if (product.vendor) attribution.push(escapeMarkdown(product.vendor));
  if (product.category) {
    attribution.push(
      escapeMarkdown(
        [...product.category.ancestors.map((a) => a.name), product.category.name].join(" > "),
      ),
    );
  }
  if (attribution.length > 0) sections.push(attribution.join(" · "), "");

  const summary = summarize(product);
  if (summary) sections.push(`> ${escapeMarkdown(summary)}`, "");

  sections.push(priceLine(product, locale), "");

  if (product.description) {
    sections.push("## About", "", escapeMarkdown(product.description), "");
  }

  if (product.options.length > 0) {
    sections.push("## Options", "");
    for (const option of product.options) {
      const values = option.values.map((v) => escapeMarkdown(v.name)).join(", ");
      sections.push(`- **${escapeMarkdown(option.name)}**: ${values}`);
    }
    sections.push("");
  }

  if (product.images.length > 0) {
    sections.push("## Images", "");
    for (const image of product.images) {
      sections.push(`- ![${escapeMarkdown(image.altText)}](${image.url})`);
    }
    sections.push("");
  }

  sections.push(
    "## Buy",
    "",
    `- Shop: ${new URL(`/products/${product.handle}`, siteUrl)}`,
    `- Live availability and agent checkout: UCP profile at ${new URL("/.well-known/ucp", siteUrl)}`,
    "",
    "---",
    "",
    `*Last updated: ${product.updatedAt.slice(0, 10)} · Prices in ${product.currencyCode}*`,
  );

  return sections.join("\n");
}
