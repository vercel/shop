import { shopConfig } from "@/lib/config";
import type { Image } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";

interface ProductSchemaData {
  availableForSale: boolean;
  currencyCode: string;
  description: string;
  handle: string;
  id: string;
  images: Image[];
  offerCount: number;
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  title: string;
  vendor?: string;
}

interface ProductSchemaProps {
  product: ProductSchemaData;
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const url = `${shopConfig.site.url}/products/${product.handle}`;
  const schema = {
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

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
