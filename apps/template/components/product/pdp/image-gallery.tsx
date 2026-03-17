"use client";

import Image from "next/image";
import { Suspense, use, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

function Fallback() {
  return (
    <div className="space-y-3">
      <Skeleton className="w-full aspect-square rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="size-16 rounded-lg" />
        <Skeleton className="size-16 rounded-lg" />
        <Skeleton className="size-16 rounded-lg" />
      </div>
    </div>
  );
}

function Content({ productPromise }: { productPromise: Promise<ProductDetails> }) {
  const product = use(productPromise);
  const images = product.images;
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) return null;

  const selectedImage = images[selectedIndex];

  return (
    <div className="@container space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText || `${product.title} image ${selectedIndex + 1}`}
          fill
          className="object-contain"
          sizes="(min-width: 1280px) 0px, (min-width: 1024px) 66vw, 100vw"
          loading="lazy"
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {images.map((image, idx) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative shrink-0 size-16 @sm:size-20 rounded-lg overflow-hidden border-2 transition-colors",
                idx === selectedIndex
                  ? "border-foreground"
                  : "border-transparent hover:border-foreground/30",
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <Image
                src={image.url}
                alt={image.altText || `${product.title} thumbnail ${idx + 1}`}
                fill
                className="object-contain"
                sizes="80px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ImageGallery({ productPromise }: { productPromise: Promise<ProductDetails> }) {
  return (
    <Suspense fallback={<Fallback />}>
      <Content productPromise={productPromise} />
    </Suspense>
  );
}
