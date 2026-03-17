import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card";
import { getLocale } from "@/lib/params";
import type { ContentSection } from "@/lib/types";

interface FeaturedProductsSectionProps {
  section: ContentSection;
}

export async function FeaturedProductsSection({ section }: FeaturedProductsSectionProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("product")]);
  const { title, products, settings } = section;
  const maxProducts =
    typeof settings?.maxProducts === "number" ? settings.maxProducts : products.length;

  if (products.length === 0) return null;

  const visibleProducts = products.slice(0, maxProducts);

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {title && <h2 className="mb-8 text-3xl font-semibold tracking-tight">{title}</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              outOfStockText={t("outOfStock")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
