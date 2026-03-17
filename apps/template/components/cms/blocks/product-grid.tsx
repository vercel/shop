import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card";
import { getLocale } from "@/lib/params";
import type { ContentSection } from "@/lib/types";

interface ProductGridSectionProps {
  section: ContentSection;
}

export async function ProductGridSection({ section }: ProductGridSectionProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("product")]);
  const { title, collectionProducts, products, settings } = section;
  const limit = typeof settings?.limit === "number" ? settings.limit : 8;

  const sourceProducts =
    collectionProducts && collectionProducts.length > 0 ? collectionProducts : products;

  if (sourceProducts.length === 0) return null;

  const visibleProducts = sourceProducts.slice(0, limit);

  return (
    <section className="py-12">
      {title && <h2 className="mb-8 text-3xl font-semibold tracking-tight">{title}</h2>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            outOfStockText={t("outOfStock")}
          />
        ))}
      </div>
    </section>
  );
}
