import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails } from "@/lib/types";

function Fallback() {
  return (
    <div className="flex flex-col gap-y-2">
      <div>
        <Skeleton className="h-5 w-32 mb-2" />

        <Skeleton className="h-10 w-full mb-1" />
        <Skeleton className="h-10 w-3/4" />

        <Skeleton className="h-5 w-48 mt-2" />

        <div className="mt-2 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>

      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

async function Render({ productPromise }: { productPromise: Promise<ProductDetails> }) {
  const product = await productPromise;

  return (
    <div className="flex flex-col gap-y-2">
      <div>
        <h1 className="text-3xl text-main-foreground font-semibold leading-9">{product.title}</h1>
        {product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm">{product.description}</p>
    </div>
  );
}

export function Info({ productPromise }: { productPromise: Promise<ProductDetails> }) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render productPromise={productPromise} />
    </Suspense>
  );
}
