import Link from "next/link";

import { productCardToOptimisticInfo } from "@/components/cart/optimistic-info";
import { FeaturedBadge } from "@/components/featured-badge";
import {
  ProductCardBadge,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCard as ProductCardRoot,
  ProductCardSkeleton,
  ProductCardTitle,
} from "@/components/ui/product-card";
import { ProductCardQuickAdd } from "@/components/ui/product-card-quick-add";
import type { Locale } from "@/lib/i18n";
import type { ProductCard as ProductCardType } from "@/lib/types";

export interface ProductCardProps {
  product: ProductCardType;
  locale: Locale;
  variant?: "default" | "featured";
  outOfStockText?: string;
  sizes?: string;
  className?: string;
}

export function ProductCard({
  product,
  locale,
  variant = "default",
  outOfStockText,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw",
  className,
}: ProductCardProps) {
  const isFeatured = variant === "featured";

  return (
    <Link href={`/products/${product.handle}`} className={className}>
      <ProductCardRoot variant={variant}>
        {isFeatured && (
          <ProductCardBadge>
            <FeaturedBadge />
          </ProductCardBadge>
        )}
        <ProductCardImageContainer variant={variant}>
          <ProductCardImage
            src={product.featuredImage?.url}
            alt={product.featuredImage?.altText || product.title}
            sizes={sizes}
            outOfStock={!product.availableForSale}
            outOfStockText={outOfStockText}
            fallbackTitle={product.title}
          >
            {product.availableForSale && product.defaultVariantId && (
              <ProductCardQuickAdd
                variantId={product.defaultVariantId}
                productInfo={productCardToOptimisticInfo(product)}
              />
            )}
          </ProductCardImage>
          <ProductCardContent>
            <ProductCardTitle>{product.title}</ProductCardTitle>
            <ProductCardPrice
              amount={product.price.amount}
              currencyCode={product.price.currencyCode}
              compareAtAmount={product.compareAtPrice?.amount}
              compareAtCurrencyCode={product.compareAtPrice?.currencyCode}
              locale={locale}
              discountVariant={isFeatured ? "blue" : "green"}
            />
          </ProductCardContent>
        </ProductCardImageContainer>
      </ProductCardRoot>
    </Link>
  );
}

export { ProductCardSkeleton };
