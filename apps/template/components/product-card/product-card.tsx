import { getTranslations } from "next-intl/server";
import Link from "next/link";

import type { Locale } from "@/lib/i18n";
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
  locale: Locale;
  imageFetchPriority?: "high" | "low" | "auto";
  imageLoading?: "eager" | "lazy";
  variant?: "default" | "featured";
  outOfStockText?: string;
  className?: string;
}

export async function ProductCard({
  product,
  locale,
  imageFetchPriority,
  imageLoading,
  variant = "default",
  outOfStockText,
  className,
}: ProductCardProps) {
  const isFeatured = variant === "featured";
  const t = isFeatured ? await getTranslations("product") : null;

  return (
    <Link href={`/products/${product.handle}`} className={className} prefetch={true}>
      <ProductCardRoot variant={variant}>
        {isFeatured && t && (
          <ProductCardBadge>
            <span className="inline-flex self-start items-center pl-2 pr-5 py-0.5 bg-primary rounded-tl-lg not-supports-[clip-path:shape(from_0_0)]:rounded-tr-lg clip-featured-badge text-xs text-primary-foreground font-medium">
              {t("featuredBadge")}
            </span>
          </ProductCardBadge>
        )}
        <ProductCardImageContainer variant={variant}>
          <ProductCardImage
            src={product.featuredImage?.url}
            hoverSrc={product.secondaryImage?.url}
            alt={product.featuredImage?.altText || product.title}
            fetchPriority={imageFetchPriority}
            loading={imageLoading}
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
