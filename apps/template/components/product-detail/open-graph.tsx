import type { Money } from "@/lib/types";

interface ProductOpenGraphProps {
  availableForSale: boolean;
  price: Money;
}

// Next Metadata cannot emit product `property=` tags, so React hoists these raw meta elements.
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
