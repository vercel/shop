import type { ContentSection } from "@/lib/types";
import { getLocale } from "@/lib/params";
import { TopProductsCarousel } from "./top-products-carousel";

interface TopProductsSectionProps {
  section: ContentSection;
}

export async function TopProductsSection({ section }: TopProductsSectionProps) {
  const locale = await getLocale();
  const { title, products, collectionProducts } = section;

  const resolvedProducts =
    products.length > 0 ? products : (collectionProducts ?? []);

  if (resolvedProducts.length === 0) return null;

  return (
    <TopProductsCarousel
      title={title || "Top Products"}
      products={resolvedProducts}
      locale={locale}
    />
  );
}
