import Image from "next/image";
import Link from "next/link";

import type { ProductVariantComponent, ProductVariantReference } from "@/lib/types";

interface BundleListItem {
  href: string;
  image: ProductVariantReference["image"];
  key: string;
  quantity?: number;
  title: string;
}

interface BundleComponentsProps {
  components: ProductVariantComponent[];
  title: string;
}

export function BundleComponents({ components, title }: BundleComponentsProps) {
  if (components.length === 0) return null;
  const items = components.map(
    ({ quantity, variant }): BundleListItem => ({
      href: `/products/${variant.product.handle}`,
      image: variant.image ?? variant.product.featuredImage,
      key: variant.id,
      quantity,
      title: variant.product.title,
    }),
  );
  return <BundleProductList items={items} title={title} />;
}

interface BundleParentsProps {
  title: string;
  variants: ProductVariantReference[];
}

export function BundleParents({ title, variants }: BundleParentsProps) {
  // A component variant is grouped into many bundle variant combinations that all
  // belong to the same bundle product — collapse to one link per bundle product.
  const byProduct = new Map<string, ProductVariantReference>();
  for (const variant of variants) {
    if (!byProduct.has(variant.product.handle)) byProduct.set(variant.product.handle, variant);
  }
  if (byProduct.size === 0) return null;
  const items = [...byProduct.values()].map(
    (variant): BundleListItem => ({
      href: `/products/${variant.product.handle}`,
      image: variant.product.featuredImage ?? variant.image,
      key: variant.product.handle,
      title: variant.product.title,
    }),
  );
  return <BundleProductList items={items} title={title} />;
}

interface BundleProductListProps {
  items: BundleListItem[];
  title: string;
}

function BundleProductList({ items, title }: BundleProductListProps) {
  return (
    <div className="grid gap-2.5" data-slot="bundle-components">
      <h2 className="font-medium text-foreground/70 text-sm">{title}</h2>
      <ul className="grid gap-2.5">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:border-foreground/30"
            >
              {item.image ? (
                <Image
                  src={item.image.url}
                  alt={item.image.altText || item.title}
                  width={48}
                  height={48}
                  className="size-12 rounded-md object-cover"
                />
              ) : null}
              <span className="min-w-0 flex-1 truncate font-medium text-sm">{item.title}</span>
              {item.quantity && item.quantity > 1 ? (
                <span className="text-foreground/50 text-sm">×{item.quantity}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
