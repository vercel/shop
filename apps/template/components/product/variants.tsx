import { getLocale } from "@/lib/params";
import { Picker } from "./picker";
import type { ProductDetails } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function Fallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-20 rounded-md" />
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
  const [product, locale] = await Promise.all([productPromise, getLocale()]);

  return (
    <div className="space-y-6">
      <Picker
        productHandle={product.handle}
        locale={locale}
        variants={product.variants}
        options={product.options}
      />
    </div>
  );
}

export function Variants({
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
