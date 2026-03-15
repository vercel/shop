import Image from "next/image";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface OrderCardProps extends ComponentProps<"article"> {
  highlighted?: boolean;
}

function OrderCard({
  highlighted = false,
  className,
  children,
  ...props
}: OrderCardProps) {
  return (
    <article
      data-slot="order-card"
      data-highlighted={highlighted}
      className={cn(
        "flex flex-row gap-6 p-3 rounded-xl border transition-colors",
        "data-[highlighted=true]:bg-muted",
        className,
      )}
      {...props}
    >
      {children}
    </article>
  );
}

interface OrderCardImagesProps extends ComponentProps<"div"> {
  images: Array<{ src: string; alt: string }>;
  maxVisible?: number;
}

function OrderCardImages({
  images,
  maxVisible = 3,
  className,
  ...props
}: OrderCardImagesProps) {
  const visibleImages = images.slice(0, maxVisible);
  const hasLarge = visibleImages.length > 0;
  const hasSmall = visibleImages.length > 1;

  return (
    <div
      data-slot="order-card-images"
      className={cn("flex flex-row gap-1 items-center shrink-0", className)}
      {...props}
    >
      {/* Large thumbnail */}
      {hasLarge && (
        <div className="relative size-[72px] rounded-md bg-muted data-[highlighted=true]:bg-white overflow-hidden">
          <Image
            src={visibleImages[0].src}
            alt={visibleImages[0].alt}
            fill
            className="object-cover"
            sizes="72px"
          />
        </div>
      )}
      {/* Stacked small thumbnails */}
      {hasSmall && (
        <div className="flex flex-col gap-1">
          {visibleImages.slice(1, 3).map((img) => (
            <div
              key={`${img.src}-${img.alt}`}
              className="relative size-[34px] rounded-md bg-muted data-[highlighted=true]:bg-white overflow-hidden"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="34px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type OrderStatusVariant =
  | "in-progress"
  | "received"
  | "delivered"
  | "cancelled";

interface OrderCardBadgeProps extends ComponentProps<"span"> {
  variant?: OrderStatusVariant;
}

function OrderCardBadge({
  variant = "received",
  className,
  children,
  ...props
}: OrderCardBadgeProps) {
  return (
    <span
      data-slot="order-card-badge"
      data-status={variant}
      className={cn(
        "inline-flex items-center px-[7px] py-0 rounded-[119px] text-sm font-semibold",
        // In progress / Out for delivery - blue
        "data-[status=in-progress]:bg-primary data-[status=in-progress]:text-white",
        // Order received - black
        "data-[status=received]:bg-foreground data-[status=received]:text-background",
        // Delivered - green (matching Figma "Fast shipping" badge style)
        "data-[status=delivered]:bg-positive data-[status=delivered]:text-white",
        // Cancelled - muted
        "data-[status=cancelled]:bg-foreground/50 data-[status=cancelled]:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function OrderCardContent({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="order-card-content"
      className={cn("flex flex-col gap-4 py-3 px-2 min-w-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function OrderCardHeader({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="order-card-header"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function OrderCardTitle({
  className,
  children,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="order-card-title"
      className={cn("text-xl font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

function OrderCardItemCount({
  className,
  children,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      data-slot="order-card-item-count"
      className={cn("text-sm font-medium text-black/30", className)}
      {...props}
    >
      {children}
    </span>
  );
}

interface OrderCardProductListProps extends ComponentProps<"div"> {
  products: string[];
  maxVisible?: number;
}

function OrderCardProductList({
  products,
  maxVisible = 1,
  className,
  ...props
}: OrderCardProductListProps) {
  const visibleProducts = products.slice(0, maxVisible);
  const remaining = products.length - maxVisible;

  return (
    <div
      data-slot="order-card-product-list"
      className={cn("flex flex-row gap-2 items-start", className)}
      {...props}
    >
      <span className="text-sm font-medium text-foreground line-clamp-1">
        {visibleProducts.join(", ")}
      </span>
      {remaining > 0 && (
        <span className="text-sm font-medium text-foreground/50 shrink-0">
          {remaining}+
        </span>
      )}
    </div>
  );
}

function OrderCardDetails({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="order-card-details"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  OrderCard,
  OrderCardImages,
  OrderCardBadge,
  OrderCardContent,
  OrderCardHeader,
  OrderCardTitle,
  OrderCardItemCount,
  OrderCardProductList,
  OrderCardDetails,
  type OrderStatusVariant,
};
