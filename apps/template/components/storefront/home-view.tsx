import type { Locale } from "@/lib/i18n";
import type { ProductCard } from "@/lib/types";

interface HomeViewProps {
  locale: Locale;
  products: Promise<ProductCard[]>;
}

export async function HomeView({ locale, products }: HomeViewProps) {
  const resolvedProducts = await products;

  return (
    <div
      data-locale={locale}
      data-product-count={resolvedProducts.length}
      data-storefront-canvas="home"
    />
  );
}

export function HomeViewFallback({ locale }: { locale: Locale }) {
  return <div data-locale={locale} data-loading data-storefront-canvas="home" />;
}
