import Link from "next/link";

import { ProductCard } from "@/components/product-card/product-card";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n/server";
import type { ProductCard as ProductCardType } from "@/lib/types";

interface ProductsGridProps {
  title: string;
  products: ProductCardType[];
  locale: Locale;
  collectionUrl?: string;
}

export async function ProductsGrid({ title, products, locale, collectionUrl }: ProductsGridProps) {
  const [viewAll, outOfStockText] = await Promise.all([
    t("product.viewAll"),
    t("product.outOfStock"),
  ]);
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter">{title}</h2>
        {collectionUrl && (
          <Link
            href={collectionUrl}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {viewAll}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            outOfStockText={outOfStockText}
          />
        ))}
      </div>
    </div>
  );
}
