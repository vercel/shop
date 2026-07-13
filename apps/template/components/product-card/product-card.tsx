import { getTranslations } from "next-intl/server";
import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import type { ProductCard as ProductCardType } from "@/lib/types";

import {
  type ProductCardAspectRatio,
  ProductCardBadge,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCard as ProductCardRoot,
  ProductCardSkeleton,
} from "./components";

export interface ProductCardProps {
  product: ProductCardType;
  locale: Locale;
  aspectRatio?: ProductCardAspectRatio;
  variant?: "default" | "featured";
  outOfStockText?: string;
  sizes?: string;
  className?: string;
}

export async function ProductCard({
  product,
  aspectRatio = "square",
  variant = "default",
  outOfStockText,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw",
  className,
}: ProductCardProps) {
  const isFeatured = variant === "featured";
  const t = isFeatured ? await getTranslations("product") : null;

  return (
    <Link href={`/products/${product.handle}`} className={className}>
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
            alt={product.featuredImage?.altText || product.title}
            sizes={sizes}
            outOfStock={!product.availableForSale}
            outOfStockText={outOfStockText}
            aspectRatio={aspectRatio}
          />
        </ProductCardImageContainer>
      </ProductCardRoot>
    </Link>
  );
}

export { ProductCardSkeleton };
