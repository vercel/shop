"use client";

import Image from "next/image";
import { type ComponentPropsWithoutRef, Suspense, use } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

import { getImagesForSelectedColor } from "./variants";
import type { SelectedOptions } from "./variants";

interface ImageStackContentProps extends ComponentPropsWithoutRef<"div"> {
  images: Array<{ url: string; altText: string }>;
  title: string;
}

function ImageStackContent({ images, title, className, ...props }: ImageStackContentProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {images.map((image, idx) => (
        <div key={image.url} className="relative aspect-square w-full overflow-hidden ">
          <Image
            src={image.url}
            alt={image.altText || `${title} image ${idx + 1}`}
            fill
            className="object-contain "
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
      <Skeleton className="w-full aspect-square " />
      <Skeleton className="w-full aspect-square " />
    </div>
  );
}

function Content({
  productPromise,
  selectedOptions,
}: {
  productPromise: Promise<ProductDetails>;
  selectedOptions: SelectedOptions;
}) {
  const product = use(productPromise);
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
  selectedOptions,
}: {
  productPromise: Promise<ProductDetails>;
  selectedOptions: SelectedOptions;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Content productPromise={productPromise} selectedOptions={selectedOptions} />
    </Suspense>
  );
}
