import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card/product-card";
import {
  ScrollCarousel,
  ScrollCarouselContent,
  ScrollCarouselHeader,
  ScrollCarouselItem,
  ScrollCarouselNav,
  ScrollCarouselTitle,
} from "@/components/ui/scroll-carousel";
import type { Locale } from "@/lib/i18n";
import type { ProductCard as ProductCardType } from "@/lib/types";

interface ProductsCarouselProps {
  title: string;
  products: ProductCardType[];
  locale: Locale;
}

export async function ProductsCarousel({ title, products, locale }: ProductsCarouselProps) {
  const t = await getTranslations("product");
  return (
    <ScrollCarousel>
      <ScrollCarouselHeader>
        <ScrollCarouselTitle>{title}</ScrollCarouselTitle>
        <ScrollCarouselNav />
      </ScrollCarouselHeader>
      <ScrollCarouselContent>
        {products.map((product) => (
          <ScrollCarouselItem key={product.id}>
            <ProductCard product={product} locale={locale} outOfStockText={t("outOfStock")} />
          </ScrollCarouselItem>
        ))}
      </ScrollCarouselContent>
    </ScrollCarousel>
  );
}
