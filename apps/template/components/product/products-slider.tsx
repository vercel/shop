import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card/product-card";
import {
  Slider,
  SliderContent,
  SliderHeader,
  SliderItem,
  SliderNav,
  SliderTitle,
} from "@/components/ui/slider";
import type { Locale } from "@/lib/i18n";
import type { ProductCard as ProductCardType } from "@/lib/types";

interface ProductsSliderProps {
  title: string;
  products: ProductCardType[];
  locale: Locale;
}

export async function ProductsSlider({ title, products, locale }: ProductsSliderProps) {
  const t = await getTranslations("product");
  return (
    <Slider>
      <SliderHeader>
        <SliderTitle>{title}</SliderTitle>
        <SliderNav />
      </SliderHeader>
      <SliderContent>
        {products.map((product) => (
          <SliderItem key={product.id}>
            <ProductCard product={product} locale={locale} outOfStockText={t("outOfStock")} />
          </SliderItem>
        ))}
      </SliderContent>
    </Slider>
  );
}
