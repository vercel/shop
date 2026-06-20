import type { Money } from "@/lib/types";

interface ProductOpenGraphProps {
  availableForSale: boolean;
  price: Money;
}

// Renders the OpenGraph "product" object tags as raw <meta property> elements
// (React 19 hoists them to <head>). Next's Metadata API has no product OG variant,
// and its `other` field emits name= rather than the property= that OG parsers need.
// Both the product:* (Facebook) and og:price/availability (Pinterest, older parsers)
// namespaces are emitted for broad compatibility. Priced off the "from" (min) price
// to match the displayed price and the JSON-LD AggregateOffer lowPrice.
export function ProductOpenGraph({ availableForSale, price }: ProductOpenGraphProps) {
  return (
    <>
      <meta property="og:type" content="product" />
      <meta property="og:price:amount" content={price.amount} />
      <meta property="og:price:currency" content={price.currencyCode} />
      <meta property="og:availability" content={availableForSale ? "instock" : "oos"} />
      <meta property="product:price:amount" content={price.amount} />
      <meta property="product:price:currency" content={price.currencyCode} />
      <meta
        property="product:availability"
        content={availableForSale ? "in stock" : "out of stock"}
      />
    </>
  );
}
