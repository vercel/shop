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
import { t } from "@/lib/i18n/server";
import type { ProductCard as ProductCardType } from "@/lib/types";

interface ProductsCarouselProps {
  title: string;
  products: ProductCardType[];
  locale: Locale;
}

export async function ProductsCarousel({ title, products, locale }: ProductsCarouselProps) {
  const outOfStockText = await t("product.outOfStock");
  return (
    <ScrollCarousel>
      <ScrollCarouselHeader>
        <ScrollCarouselTitle>{title}</ScrollCarouselTitle>
        <ScrollCarouselNav />
      </ScrollCarouselHeader>
      <ScrollCarouselContent>
        {products.map((product) => (
          <ScrollCarouselItem key={product.id}>
            <ProductCard product={product} locale={locale} outOfStockText={outOfStockText} />
          </ScrollCarouselItem>
        ))}
      </ScrollCarouselContent>
    </ScrollCarousel>
  );
}
