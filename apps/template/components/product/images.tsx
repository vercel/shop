import { ImageGallery } from "./image-gallery";
import type { ProductDetails } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function Fallback() {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex flex-row lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] scrollbar-hide">
        <Skeleton className="shrink-0 size-20 aspect-square rounded-lg" />
        <Skeleton className="shrink-0 size-20 aspect-square rounded-lg" />
        <Skeleton className="shrink-0 size-20 aspect-square rounded-lg" />
        <Skeleton className="shrink-0 size-20 aspect-square rounded-lg" />
      </div>

      <div className="flex-1 order-1 lg:order-2">
        <Skeleton className="relative w-full aspect-3/4 rounded-lg" />

        <div className="mt-4 flex justify-center gap-2">
          <Skeleton className="h-1.5 w-8 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

async function Render({
  productPromise,
}: {
  productPromise: Promise<ProductDetails>;
}) {
  const product = await productPromise;

  const featuredUrl = product.featuredImage?.url;
  const images = [
    product.featuredImage,
    ...product.images.filter((img) => img.url !== featuredUrl),
  ].filter((img): img is NonNullable<typeof img> => img !== null);

  return <ImageGallery images={images} title={product.title} />;
}

export function Images({
  productPromise,
}: {
  productPromise: Promise<ProductDetails>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render productPromise={productPromise} />
    </Suspense>
  );
}
