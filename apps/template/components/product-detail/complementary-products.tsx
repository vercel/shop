import Image from "next/image";
import Link from "next/link";

import { Price } from "@/components/product/price";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { getComplementaryProducts } from "@/lib/shopify/operations/products";
import type { ProductCard } from "@/lib/types";

export async function ComplementaryProducts({
  handle,
  limit,
  title,
}: {
  handle: string;
  limit: number;
  title: string;
}) {
  const complementary = await getComplementaryProducts({
    handle,
  });
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
                className="shrink-0 text-sm"
                currencyCode={product.price.currencyCode}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
