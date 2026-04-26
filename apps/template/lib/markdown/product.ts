import type { ProductDetails } from "@/lib/types";

import { createTable, escapeMarkdown, formatPrice } from "./utils";

/** Output is consumed by agents/crawlers, so structure must stay parseable. */
export function productToMarkdown(product: ProductDetails, locale: string): string {
  const sections: string[] = [];

  sections.push(`# ${escapeMarkdown(product.title)}`);
  sections.push("");

  sections.push("## Product Information");
  sections.push("");
  sections.push(`- **Handle**: ${product.handle}`);
  if (product.vendor) {
    sections.push(`- **Brand**: ${escapeMarkdown(product.vendor)}`);
  }
  if (product.category) {
    const categoryPath = [
      ...product.category.ancestors.map((a) => a.name),
      product.category.name,
    ].join(" > ");
    sections.push(`- **Category**: ${escapeMarkdown(categoryPath)}`);
  }
  sections.push(`- **Available**: ${product.availableForSale ? "Yes" : "No"}`);
  sections.push("");

  sections.push("## Pricing");
  sections.push("");
  sections.push(`- **Price**: ${formatPrice(product.price, locale)}`);
  if (product.compareAtPrice) {
    sections.push(`- **Compare At**: ${formatPrice(product.compareAtPrice, locale)}`);
    const savings =
      Number.parseFloat(product.compareAtPrice.amount) - Number.parseFloat(product.price.amount);
    if (savings > 0) {
      const savingsPercent = Math.round(
        (savings / Number.parseFloat(product.compareAtPrice.amount)) * 100,
      );
      sections.push(
        `- **Savings**: ${formatPrice({ amount: savings.toString(), currencyCode: product.currencyCode }, locale)} (${savingsPercent}% off)`,
      );
    }
  }
  if (product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount) {
    sections.push(
      `- **Price Range**: ${formatPrice(product.priceRange.minVariantPrice, locale)} - ${formatPrice(product.priceRange.maxVariantPrice, locale)}`,
    );
  }
  sections.push("");

  if (product.description) {
    sections.push("## Description");
    sections.push("");
    sections.push(escapeMarkdown(product.description));
    sections.push("");
  }

  if (product.options.length > 0) {
    sections.push("## Options");
    sections.push("");
    for (const option of product.options) {
      const values = option.values.map((v) => escapeMarkdown(v.name)).join(", ");
      sections.push(`- **${escapeMarkdown(option.name)}**: ${values}`);
    }
    sections.push("");
  }

  if (product.variants.length > 0) {
    sections.push("## Variants");
    sections.push("");

    const optionNames = product.options.map((o) => o.name);
    const headers = ["Variant", ...optionNames.map(escapeMarkdown), "Price", "Available"];

    const rows = product.variants.map((variant) => {
      const optionValues = optionNames.map((name) => {
        const option = variant.selectedOptions.find((o) => o.name === name);
        return escapeMarkdown(option?.value || "-");
      });
      return [
        escapeMarkdown(variant.title),
        ...optionValues,
        formatPrice(variant.price, locale),
        variant.availableForSale ? "Yes" : "No",
      ];
    });

    sections.push(createTable(headers, rows));
    sections.push("");
  }

  if (product.metafields && product.metafields.length > 0) {
    sections.push("## Specifications");
    sections.push("");

    const headers = ["Spec", "Value"];
    const rows = product.metafields.map((field) => [
      escapeMarkdown(field.label),
      escapeMarkdown(field.value),
    ]);

    sections.push(createTable(headers, rows));
    sections.push("");
  }

  if (product.images.length > 0) {
    sections.push("## Images");
    sections.push("");
    for (const image of product.images) {
      sections.push(`- ${image.url}`);
    }
    sections.push("");
  }

  if (product.tags.length > 0) {
    sections.push("## Tags");
    sections.push("");
    sections.push(product.tags.join(", "));
    sections.push("");
  }

  if (product.seo.title || product.seo.description) {
    sections.push("## SEO");
    sections.push("");
    if (product.seo.title) {
      sections.push(`- **Title**: ${escapeMarkdown(product.seo.title)}`);
    }
    if (product.seo.description) {
      sections.push(`- **Description**: ${escapeMarkdown(product.seo.description)}`);
    }
    sections.push("");
  }

  sections.push("---");
  sections.push("");
  sections.push(`*Last updated: ${product.updatedAt}*`);
  sections.push(`*Locale: ${locale} | Currency: ${product.currencyCode}*`);

  return sections.join("\n");
}
