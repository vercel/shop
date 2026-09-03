import { shopConfig } from "@/lib/config";
import type { Image, Money } from "@/lib/types";

interface ProductSchemaData {
  id: string;
  handle: string;
  title: string;
  description: string;
  images: Image[];
  vendor?: string;
  currencyCode: string;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  offerCount: number;
  availableForSale: boolean;
}

function generateProductSchema(product: ProductSchemaData) {
  const url = `${shopConfig.site.url}/products/${product.handle}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((img) => img.url),
    brand: product.vendor
      ? {
          "@type": "Brand",
          name: product.vendor,
        }
      : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: product.currencyCode,
      lowPrice: product.priceRange.minVariantPrice.amount,
      highPrice: product.priceRange.maxVariantPrice.amount,
      offerCount: product.offerCount,
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
