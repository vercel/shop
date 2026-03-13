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

interface RecommendationsCarouselProps {
  title: string;
  products: ProductCardType[];
  locale: Locale;
}

export function RecommendationsCarousel({
  title,
  products,
  locale,
}: RecommendationsCarouselProps) {
  const t = useTranslations("product");
  return (
    <ScrollCarousel>
      <ScrollCarouselHeader>
        <ScrollCarouselTitle>{title}</ScrollCarouselTitle>
        <ScrollCarouselNav />
      </ScrollCarouselHeader>
      <ScrollCarouselContent>
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
