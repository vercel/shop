"use client";

import Image from "next/image";
import { type ComponentPropsWithoutRef, Suspense, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePdpVariantState } from "./variant-state";
import { getImagesForSelectedColor } from "./variants";

interface ImageStackContentProps extends ComponentPropsWithoutRef<"div"> {
  images: Array<{ url: string; altText: string }>;
  title: string;
}

function ImageStackContent({
  images,
  title,
  className,
  ...props
}: ImageStackContentProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {images.map((image, idx) => (
        <div
          key={image.url}
          className="relative aspect-square w-full overflow-hidden rounded-xl"
        >
          <Image
            src={image.url}
            alt={image.altText || `${title} image ${idx + 1}`}
            fill
            className="object-contain rounded-xl"
            sizes="(min-width: 1280px) 33vw, 100vw"
            priority={idx === 0}
            loading={idx === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}

function Fallback() {
  return (
    <div className="space-y-3">
      <Skeleton className="w-full aspect-square rounded-xl" />
      <Skeleton className="w-full aspect-square rounded-xl" />
    </div>
  );
}

function Content({
  productPromise,
}: {
  productPromise: Promise<ProductDetails>;
}) {
  const product = use(productPromise);
  const { selectedOptions } = usePdpVariantState();
  const images = getImagesForSelectedColor(
    product.images,
    product.options,
    product.variants,
    selectedOptions,
  );

  return <ImageStackContent images={images} title={product.title} />;
}

export function ImageStack({
  productPromise,
}: {
  productPromise: Promise<ProductDetails>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Content productPromise={productPromise} />
    </Suspense>
  );
}
