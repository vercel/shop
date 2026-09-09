import { unstable_navigation } from "next/cache";
import Image from "next/image";
import { Suspense } from "react";

import { Price } from "@/components/product/price";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import Link from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCard } from "@/lib/product/types";
import { getComplementaryProducts } from "@/lib/shopify/operations/products/server";

interface ComplementaryProductsProps {
  handle: string;
  limit: number;
  locale: string;
  title: string;
}

export function ComplementaryProducts(props: ComplementaryProductsProps) {
  return (
    <Suspense fallback={<ComplementaryProductsSkeleton limit={props.limit} title={props.title} />}>
      <Render {...props} />
    </Suspense>
  );
}

function ComplementaryProductsSkeleton({ limit, title }: { limit: number; title: string }) {
  return (
    <div className="grid gap-2.5" data-slot="complementary-products">
      <h2 className="font-medium text-foreground/70 text-sm">{title}</h2>
      <div className="grid gap-2.5" aria-hidden="true">
        {Array.from({ length: limit }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-2.5 rounded-lg border border-border p-2.5"
          >
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="h-4 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function Render({ handle, limit, locale, title }: ComplementaryProductsProps) {
  await unstable_navigation();
  const complementary = await getComplementaryProducts({ handle, locale });
  if (complementary.length === 0) return null;

  return (
    <div className="grid gap-2.5" data-slot="complementary-products">
      <h2 className="font-medium text-foreground/70 text-sm">{title}</h2>
      <ul className="grid gap-2.5">
        {complementary.slice(0, limit).map((product: ProductCard) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.handle}`}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:border-foreground/30"
            >
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  width={48}
                  height={48}
                  className="size-12 rounded-md object-cover"
                />
              ) : (
                <ImagePlaceholder className="size-12 shrink-0 rounded-md" />
              )}
              <span className="min-w-0 flex-1 truncate font-medium text-sm">{product.title}</span>
              <Price
                amount={product.price.amount}
                className="shrink-0 text-foreground/50 text-sm"
                locale={locale}
                currencyCode={product.price.currencyCode}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
