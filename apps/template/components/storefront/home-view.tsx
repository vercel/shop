import type { Locale } from "@/lib/i18n";
import type { ProductCard } from "@/lib/types";

import { StorefrontCanvas } from "./canvas";

interface HomeViewProps {
  locale: Locale;
  products: Promise<ProductCard[]>;
}

export async function HomeView({ locale, products }: HomeViewProps) {
  const resolvedProducts = await products;

  return (
    <StorefrontCanvas
      route="home"
      data-locale={locale}
      data-product-count={resolvedProducts.length}
    />
  );
}

export function HomeViewFallback({ locale }: { locale: Locale }) {
  return <StorefrontCanvas route="home" data-locale={locale} data-loading />;
}
