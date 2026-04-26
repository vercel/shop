import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n/server";
import { productCardToOptimisticInfo } from "@/lib/product";
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
import { ProductCardQuickAdd } from "./quick-add";

export interface ProductCardProps {
  product: ProductCardType;
  locale: Locale;
  variant?: "default" | "featured";
  outOfStockText?: string;
  sizes?: string;
  className?: string;
}

export async function ProductCard({
  product,
  locale,
  variant = "default",
  outOfStockText,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw",
  className,
}: ProductCardProps) {
  const isFeatured = variant === "featured";
  const [addToCartLabel, featuredBadgeText] = await Promise.all([
    t("product.addToCart"),
    isFeatured ? t("product.featuredBadge") : Promise.resolve(""),
  ]);

  return (
    <Link
      href={
        product.defaultVariantNumericId
          ? `/products/${product.handle}?variantId=${product.defaultVariantNumericId}`
          : `/products/${product.handle}`
      }
      className={className}
    >
      <ProductCardRoot variant={variant}>
        {isFeatured && (
          <ProductCardBadge>
            <span className="inline-flex self-start items-center pl-2 pr-5 py-0.5 bg-primary rounded-tl-lg not-supports-[clip-path:shape(from_0_0)]:rounded-tr-lg clip-featured-badge text-xs text-primary-foreground font-medium">
              {featuredBadgeText}
            </span>
          </ProductCardBadge>
        )}
        <ProductCardImageContainer variant={variant}>
          <ProductCardImage
            src={product.featuredImage?.url}
            alt={product.featuredImage?.altText || product.title}
            images={product.images}
            sizes={sizes}
            outOfStock={!product.availableForSale}
            outOfStockText={outOfStockText}
            fallbackTitle={product.title}
          >
            {product.availableForSale && product.defaultVariantId && (
              <ProductCardQuickAdd
                addToCartLabel={addToCartLabel}
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
