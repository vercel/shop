import { productCardToOptimisticInfo } from "@/components/cart/optimistic-info";
import { FeaturedBadge } from "@/components/featured-badge";
import { PrefetchLink } from "@/components/prefetch-link";
import {
  ProductCard,
  ProductCardBadge,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardTitle,
} from "@/components/ui/product-card";
import { ProductCardQuickAdd } from "@/components/ui/product-card-quick-add";
import type { Locale } from "@/lib/i18n";
import type { ProductCard as ProductCardType } from "@/lib/types";

export interface ProductCardFeaturedProps {
  product: ProductCardType;
  locale: Locale;
  outOfStockText?: string;
  sizes?: string;
  className?: string;
}

export function ProductCardFeatured({
  product,
  locale,
  outOfStockText,
  sizes,
  className,
}: ProductCardFeaturedProps) {
  return (
    <PrefetchLink href={`/products/${product.handle}`} className={className}>
      <ProductCard variant="featured">
        <ProductCardBadge>
          <FeaturedBadge />
        </ProductCardBadge>
        <ProductCardImageContainer variant="featured">
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
              discountVariant="blue"
            />
          </ProductCardContent>
        </ProductCardImageContainer>
      </ProductCard>
    </PrefetchLink>
  );
}
