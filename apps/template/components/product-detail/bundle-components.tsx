import Image from "next/image";
import Link from "next/link";

import { getProductVariantUrl } from "@/lib/product-url";
import type { ProductVariantComponent, ProductVariantReference } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BundleComponentsProps {
  components: ProductVariantComponent[];
  title: string;
}

export function BundleComponents({ components, title }: BundleComponentsProps) {
  if (components.length === 0) return null;

  return (
    <BundleProductList
      columns
      items={components.map(({ quantity, variant }) => ({ quantity, variant }))}
      title={title}
    />
  );
}

interface BundleParentsProps {
  variants: ProductVariantReference[];
  title: string;
}

export function BundleParents({ variants, title }: BundleParentsProps) {
  if (variants.length === 0) return null;

  const products = new Map<string, ProductVariantReference>();
  for (const variant of variants) {
    if (!products.has(variant.product.id)) products.set(variant.product.id, variant);
  }

  return (
    <BundleProductList
      items={[...products.values()].map((variant) => ({ variant }))}
      showVariantTitle={false}
      title={title}
    />
  );
}

interface BundleProductListProps {
  columns?: boolean;
  items: Array<{ quantity?: number; variant: ProductVariantReference }>;
  showVariantTitle?: boolean;
  title: string;
}

function BundleProductList({
  columns,
  items,
  showVariantTitle = true,
  title,
}: BundleProductListProps) {
  return (
    <div className="grid gap-2.5" data-slot="bundle-components">
      <h2 className="text-sm font-medium text-foreground/70">{title}</h2>
      <ul className={cn("grid gap-2.5", columns && "sm:grid-cols-2")}>
        {items.map(({ quantity, variant }) => {
          const image = variant.image ?? variant.product.featuredImage;
          return (
            <li key={variant.id}>
              <Link
                href={getProductVariantUrl(variant.product.handle, variant.id)}
                className="flex h-full cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:border-foreground/30"
              >
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.altText || variant.product.title}
                    width={48}
                    height={48}
                    className="size-12 rounded-md object-cover"
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {variant.product.title}
                  </span>
                  {showVariantTitle ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {variant.title}
                    </span>
                  ) : null}
                </span>
                {quantity !== undefined ? (
                  <span className="text-sm text-muted-foreground">x{quantity}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
