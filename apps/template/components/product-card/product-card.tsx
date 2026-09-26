import Link from "next/link";

import { buildProductUrl } from "@/lib/product";
import type { ProductCard as ProductCardType } from "@/lib/product/types";

import {
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCard as ProductCardRoot,
  ProductCardSkeleton,
  ProductCardTitle,
} from "./components";

export interface ProductCardProps {
  product: ProductCardType;
  outOfStockText?: string;
}

export function ProductCard({ product, outOfStockText }: ProductCardProps) {
  const href = buildProductUrl(product.handle, product.defaultVariantSelectedOptions ?? []);
  return (
    <Link href={href}>
      <ProductCardRoot>
        <ProductCardImageContainer>
          <ProductCardImage
            src={product.featuredImage?.url}
            alt={product.featuredImage?.altText || product.title}
            outOfStock={!product.availableForSale}
            outOfStockText={outOfStockText}
          />
          <ProductCardContent>
            <ProductCardTitle>{product.title}</ProductCardTitle>
            <ProductCardPrice
              amount={product.price.amount}
              currencyCode={product.price.currencyCode}
              maxAmount={product.maxPrice.amount}
              compareAtAmount={product.compareAtPrice?.amount}
              compareAtCurrencyCode={product.compareAtPrice?.currencyCode}
            />
          </ProductCardContent>
        </ProductCardImageContainer>
      </ProductCardRoot>
    </Link>
  );
}

export { ProductCardSkeleton };
