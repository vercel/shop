import { Link } from "@/components/ui/link";
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
import { QuickShop } from "./quick-shop";

export interface ProductCardProps {
  outOfStockText?: string;
  product: ProductCardType;
  quickShopText?: string;
}

export function ProductCard({ outOfStockText, product, quickShopText }: ProductCardProps) {
  const href = buildProductUrl(product.handle, product.defaultVariantSelectedOptions ?? []);
  // The link is stretched rather than wrapping the card so Quick Shop isn't a button inside an anchor.
  return (
    <ProductCardRoot>
      <ProductCardImageContainer>
        <ProductCardImage
          src={product.featuredImage?.url}
          alt={product.featuredImage?.altText || product.title}
          outOfStock={!product.availableForSale}
          outOfStockText={outOfStockText}
        >
          {quickShopText && product.availableForSale && !product.isGiftCard ? (
            <QuickShop handle={product.handle} label={quickShopText} />
          ) : null}
        </ProductCardImage>
        <ProductCardContent>
          <ProductCardTitle>
            <Link href={href} className="after:absolute after:inset-0">
              {product.title}
            </Link>
          </ProductCardTitle>
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
  );
}

export { ProductCardSkeleton };
