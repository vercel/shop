import type { Image, Money, ProductVariant } from "@/lib/types";

import { siteConfig } from "@/lib/config";

interface ProductSchemaData {
  id: string;
  handle: string;
  title: string;
  description: string;
  images: Image[];
  manufacturerName: string;
  currencyCode: string;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  variants: ProductVariant[];
  availableForSale: boolean;
}

function generateProductSchema(product: ProductSchemaData) {
  const url = `${siteConfig.url}/products/${product.handle}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((img) => img.url),
    brand: product.manufacturerName
      ? {
          "@type": "Brand",
          name: product.manufacturerName,
        }
      : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: product.currencyCode,
      lowPrice: product.priceRange.minVariantPrice.amount,
      highPrice: product.priceRange.maxVariantPrice.amount,
      offerCount: product.variants.length,
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url,
    },
    sku: product.id,
  };
}

export function ProductSchema({ product }: { product: ProductSchemaData }) {
  const schema = generateProductSchema(product);

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
