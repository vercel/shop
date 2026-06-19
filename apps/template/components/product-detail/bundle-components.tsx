import Image from "next/image";
import Link from "next/link";

import type { ProductVariantComponent, ProductVariantReference } from "@/lib/types";

interface BundleComponentsProps {
  components: ProductVariantComponent[];
  title: string;
}

export function BundleComponents({ components, title }: BundleComponentsProps) {
  if (components.length === 0) return null;
  return (
    <BundleProductList
      items={components.map(({ quantity, variant }) => ({ quantity, variant }))}
      title={title}
    />
  );
}

interface BundleParentsProps {
  title: string;
  variants: ProductVariantReference[];
}

export function BundleParents({ title, variants }: BundleParentsProps) {
  if (variants.length === 0) return null;
  return <BundleProductList items={variants.map((variant) => ({ variant }))} title={title} />;
}

interface BundleProductListProps {
  items: Array<{ quantity?: number; variant: ProductVariantReference }>;
  title: string;
}

function BundleProductList({ items, title }: BundleProductListProps) {
  return (
    <div className="grid gap-2.5" data-slot="bundle-components">
      <h2 className="font-medium text-foreground/70 text-sm">{title}</h2>
      <ul className="grid gap-2.5">
        {items.map(({ quantity, variant }) => {
          const image = variant.image ?? variant.product.featuredImage;
          return (
            <li key={variant.id}>
              <Link
                href={`/products/${variant.product.handle}`}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:border-foreground/30"
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
                  <span className="block truncate font-medium text-sm">
                    {variant.product.title}
                  </span>
                  <span className="block truncate text-foreground/50 text-xs">{variant.title}</span>
                </span>
                {quantity && quantity > 1 ? (
                  <span className="text-foreground/50 text-sm">×{quantity}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
