import { shopConfig } from "@/lib/config";
import type { Image } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";

interface ProductSchemaData {
  availableForSale: boolean;
  currencyCode: string;
  description: string;
  handle: string;
  images: Image[];
  offerCount: number;
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  sku?: string;
  title: string;
  vendor?: string;
}

interface ProductSchemaProps {
  product: ProductSchemaData;
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const url = `${shopConfig.site.url}/products/${product.handle}`;
  const availability = product.availableForSale
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const singleOffer = product.offerCount === 1;
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
    offers: singleOffer
      ? {
          "@type": "Offer",
          availability,
          price: product.priceRange.minVariantPrice.amount,
          priceCurrency: product.currencyCode,
          url,
        }
      : {
          "@type": "AggregateOffer",
          availability,
          highPrice: product.priceRange.maxVariantPrice.amount,
          lowPrice: product.priceRange.minVariantPrice.amount,
          offerCount: product.offerCount,
          priceCurrency: product.currencyCode,
          url,
        },
    sku: singleOffer ? product.sku : undefined,
  };

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
