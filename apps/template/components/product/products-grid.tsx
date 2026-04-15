import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card";
import type { Locale } from "@/lib/i18n";
import type { ProductCard as ProductCardType } from "@/lib/types";

interface ProductsGridProps {
  title: string;
  products: ProductCardType[];
  locale: Locale;
}

export async function ProductsGrid({ title, products, locale }: ProductsGridProps) {
  const t = await getTranslations("product");
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            outOfStockText={t("outOfStock")}
          />
        ))}
      </div>
    </div>
  );
}
