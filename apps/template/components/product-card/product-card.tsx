import Link from "next/link";

import { buildProductUrl } from "@/lib/product";
import type { ProductCard as ProductCardType } from "@/lib/types";

import {
  ProductCardBadge,
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
  variant?: "default" | "featured";
  outOfStockText?: string;
  className?: string;
}

export function ProductCard({
  product,
  variant = "default",
  outOfStockText,
  className,
}: ProductCardProps) {
  const isFeatured = variant === "featured";
  const href = buildProductUrl(product.handle, product.defaultVariantSelectedOptions ?? []);
  return (
    <Link href={href} className={className}>
      <ProductCardRoot variant={variant}>
        {isFeatured && (
          <ProductCardBadge>
            <span className="inline-flex self-start items-center pl-2 pr-5 py-0.5 bg-primary rounded-tl-lg not-supports-[clip-path:shape(from_0_0)]:rounded-tr-lg clip-featured-badge text-xs text-primary-foreground font-medium">
              Assistant's pick
            </span>
          </ProductCardBadge>
        )}
        <ProductCardImageContainer variant={variant}>
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
              discountVariant={isFeatured ? "blue" : "green"}
            />
          </ProductCardContent>
        </ProductCardImageContainer>
      </ProductCardRoot>
    </Link>
  );
}

export { ProductCardSkeleton };
