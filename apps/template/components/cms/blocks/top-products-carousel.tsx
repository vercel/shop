"use client";

import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product-card";
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

interface TopProductsCarouselProps {
  title: string;
  products: ProductCardType[];
  locale: Locale;
}

export function TopProductsCarousel({
  title,
  products,
  locale,
}: TopProductsCarouselProps) {
  const t = useTranslations("product");
  return (
    <ScrollCarousel>
      <ScrollCarouselHeader>
        <ScrollCarouselTitle className="text-3xl font-semibold tracking-tight">
          {title}
        </ScrollCarouselTitle>
        <ScrollCarouselNav />
      </ScrollCarouselHeader>
      <ScrollCarouselContent fullBleed>
        {products.map((product) => (
          <ScrollCarouselItem key={product.id}>
            <ProductCard
              product={product}
              locale={locale}
              outOfStockText={t("outOfStock")}
            />
          </ScrollCarouselItem>
        ))}
      </ScrollCarouselContent>
    </ScrollCarousel>
  );
}
