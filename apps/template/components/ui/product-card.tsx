import Image from "next/image";
import type * as React from "react";

import { Price } from "@/components/product/price";
import { DiscountBadge } from "@/components/ui/discount-badge";
import { cn } from "@/lib/utils";

interface ProductCardProps extends React.ComponentProps<"article"> {
  variant?: "default" | "featured";
}

function ProductCard({ variant = "default", className, children, ...props }: ProductCardProps) {
  return (
    <article
      data-slot="product-card"
      data-variant={variant}
      className={cn("flex flex-col h-full group overflow-hidden", className)}
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

interface ProductCardImageProps {
  src?: string | null;
  alt: string;
  sizes?: string;
  outOfStock?: boolean;
  outOfStockText?: string;
  fallbackTitle?: string;
  className?: string;
  children?: React.ReactNode;
}

function ProductCardImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw",
  outOfStock = false,
  outOfStockText,
  fallbackTitle,
  className,
  children,
}: ProductCardImageProps) {
  return (
    <div
      data-slot="product-card-image"
      className={cn("relative aspect-square overflow-hidden bg-muted", className)}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover scale-[1.02] group-hover:scale-105 transition-transform duration-300 ease-out"
          sizes={sizes}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium text-xl p-2 text-center">
          {fallbackTitle}
        </div>
      )}
      {outOfStock && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-destructive-foreground font-medium text-xs px-2 py-1 bg-destructive rounded">
            {outOfStockText}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

function ProductCardContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="product-card-content"
      className={cn("flex flex-col flex-1 py-3", className)}
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
      className={cn(
        "text-base font-semibold text-main-foreground line-clamp-2",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

interface ProductCardPriceProps {
  amount: string;
  currencyCode: string;
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
  compareAtAmount,
  compareAtCurrencyCode,
  locale,
  discountVariant = "green",
  className,
}: ProductCardPriceProps) {
  const priceNum = parseFloat(amount);
  const compareAtNum = compareAtAmount ? parseFloat(compareAtAmount) : undefined;
  const discountPercent = getDiscountPercent(priceNum, compareAtNum);

  return (
    <div data-slot="product-card-price" className={cn(className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Price
          amount={amount}
          currencyCode={currencyCode}
          locale={locale}
          className="text-base text-main-foreground"
        />
        {discountPercent && compareAtAmount && compareAtCurrencyCode && (
          <>
            <Price
              amount={compareAtAmount}
              currencyCode={compareAtCurrencyCode}
              locale={locale}
              className="text-sm text-muted-foreground line-through"
            />
            <DiscountBadge percent={discountPercent} variant={discountVariant} />
          </>
        )}
      </div>
    </div>
  );
}

function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="product-card-skeleton"
      className={cn("flex flex-col overflow-hidden", className)}
    >
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="py-3 h-18 box-content">
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse mt-2" />
        <div className="h-4 w-12 bg-muted rounded animate-pulse mt-2" />
      </div>
    </div>
  );
}

export {
  ProductCard,
  ProductCardBadge,
  ProductCardImageContainer,
  ProductCardImage,
  ProductCardContent,
  ProductCardTitle,
  ProductCardPrice,
  ProductCardSkeleton,
};
