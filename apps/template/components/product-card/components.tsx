import Image from "next/image";
import type * as React from "react";

import { DiscountBadge } from "@/components/product/discount-badge";
import { Price } from "@/components/product/price";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { cn } from "@/lib/utils";

interface ProductCardProps extends React.ComponentProps<"article"> {
  variant?: "default" | "featured";
}

function ProductCard({ variant = "default", className, children, ...props }: ProductCardProps) {
  return (
    <article
      data-slot="product-card"
      data-variant={variant}
      className={cn("flex flex-col h-full overflow-hidden", className)}
      {...props}
    >
      {children}
    </article>
  );
}

function ProductCardBadge({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="product-card-badge" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

interface ProductCardImageContainerProps extends React.ComponentProps<"div"> {
  variant?: "default" | "featured";
}

function ProductCardImageContainer({
  variant = "default",
  className,
  children,
  ...props
}: ProductCardImageContainerProps) {
  return (
    <div
      data-slot="product-card-image-container"
      data-variant={variant}
      className={cn(
        "flex flex-col",
        "data-[variant=featured]:-mt-px data-[variant=featured]:bg-linear-to-b/oklch data-[variant=featured]:from-primary data-[variant=featured]:from-0% data-[variant=featured]:to-45% data-[variant=featured]:to-primary/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type ProductCardAspectRatio = "landscape" | "portrait" | "square";

const aspectRatioClasses =
  "data-[aspect-ratio=landscape]:aspect-[4/3] data-[aspect-ratio=portrait]:aspect-[3/4] data-[aspect-ratio=square]:aspect-square";

interface ProductCardImageProps {
  src?: string | null;
  alt: string;
  sizes?: string;
  outOfStock?: boolean;
  outOfStockText?: string;
  aspectRatio?: ProductCardAspectRatio;
  className?: string;
}

function ProductCardImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw",
  outOfStock = false,
  outOfStockText,
  aspectRatio = "square",
  className,
}: ProductCardImageProps) {
  return (
    <div
      data-slot="product-card-image"
      data-aspect-ratio={aspectRatio}
      className={cn("relative overflow-hidden", aspectRatioClasses, className)}
    >
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />
      ) : (
        <ImagePlaceholder className="size-full" />
      )}
      {outOfStock && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-destructive-foreground font-medium text-xs px-2 py-1 bg-destructive rounded">
            {outOfStockText}
          </span>
        </div>
      )}
    </div>
  );
}

function ProductCardContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="product-card-content"
      className={cn("flex flex-col flex-1 py-2.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ProductCardTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="product-card-title"
      className={cn("text-sm font-medium text-foreground line-clamp-1", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface ProductCardPriceProps {
  amount: string;
  currencyCode: string;
  /** Highest variant price; when it differs from amount the card renders a "min – max" range. */
  maxAmount?: string;
  compareAtAmount?: string;
  compareAtCurrencyCode?: string;
  locale: string;
  discountVariant?: "green" | "blue";
  className?: string;
}

function getDiscountPercent(price: number, compareAtPrice: number | undefined): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function ProductCardPrice({
  amount,
  currencyCode,
  maxAmount,
  compareAtAmount,
  compareAtCurrencyCode,
  locale,
  discountVariant = "green",
  className,
}: ProductCardPriceProps) {
  const priceNum = parseFloat(amount);
  const compareAtNum = compareAtAmount ? parseFloat(compareAtAmount) : undefined;
  const isRange = maxAmount != null && maxAmount !== amount;
  // A range's per-variant discounts differ, so a single compare-at would be misleading.
  const discountPercent = isRange ? null : getDiscountPercent(priceNum, compareAtNum);

  return (
    <div data-slot="product-card-price" className={cn(className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-baseline gap-x-1 text-sm text-foreground">
          <Price
            amount={amount}
            currencyCode={currencyCode}
            locale={locale}
            className="text-sm text-foreground"
          />
          {isRange && (
            <>
              <span>–</span>
              <Price
                amount={maxAmount}
                currencyCode={currencyCode}
                locale={locale}
                className="text-sm text-foreground"
              />
            </>
          )}
        </span>
        {discountPercent && compareAtAmount && compareAtCurrencyCode && (
          <>
            <Price
              amount={compareAtAmount}
              currencyCode={compareAtCurrencyCode}
              locale={locale}
              className="text-xs text-muted-foreground line-through"
            />
            <DiscountBadge percent={discountPercent} variant={discountVariant} />
          </>
        )}
      </div>
    </div>
  );
}

function ProductCardSkeleton({
  aspectRatio = "square",
  className,
}: {
  aspectRatio?: ProductCardAspectRatio;
  className?: string;
}) {
  return (
    <div
      data-slot="product-card-skeleton"
      className={cn("flex flex-col overflow-hidden", className)}
    >
      <ImagePlaceholder
        data-aspect-ratio={aspectRatio}
        className={cn("animate-pulse", aspectRatioClasses)}
      />
      <div className="py-2.5 h-12 box-content grid gap-2">
        <div className="h-4 w-full bg-accent animate-pulse" />
        <div className="h-4 w-12 bg-accent animate-pulse" />
      </div>
    </div>
  );
}

export {
  ProductCard,
  type ProductCardAspectRatio,
  ProductCardBadge,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardSkeleton,
  ProductCardTitle,
};
