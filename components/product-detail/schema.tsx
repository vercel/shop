import { shopConfig } from "@/lib/config";
import type { Image } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";
import { buildProductUrl } from "@/lib/product";
import type { ProductOffer } from "@/lib/product/types";

interface ProductSchemaData {
  availableForSale: boolean;
  currencyCode: string;
  description: string;
  handle: string;
  images: Image[];
  offerCount: number;
  offers: ProductOffer[];
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

function toAvailability(availableForSale: boolean) {
  return availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const url = `${shopConfig.site.url}/products/${product.handle}`;
  const singleOffer = product.offerCount === 1;
  const offers = product.offers.map((offer) => ({
    "@type": "Offer",
    availability: toAvailability(offer.availableForSale),
    name: singleOffer ? undefined : offer.title,
    price: offer.price.amount,
    priceCurrency: offer.price.currencyCode,
    sku: offer.sku,
    url: singleOffer
      ? url
      : `${shopConfig.site.url}${buildProductUrl(product.handle, offer.selectedOptions)}`,
  }));
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
    offers:
      singleOffer && offers[0]
        ? offers[0]
        : {
            "@type": "AggregateOffer",
            availability: toAvailability(product.availableForSale),
            highPrice: product.priceRange.maxVariantPrice.amount,
            lowPrice: product.priceRange.minVariantPrice.amount,
            offerCount: product.offerCount,
            offers: offers.length > 0 ? offers : undefined,
            priceCurrency: product.currencyCode,
            url,
          },
    sku: singleOffer ? product.sku : undefined,
  };

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}
