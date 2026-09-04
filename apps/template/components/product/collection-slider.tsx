import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card/product-card";
import Link from "@/components/ui/link";
import {
  Slider,
  SliderContent,
  SliderHeader,
  SliderItem,
  SliderNav,
  SliderTitle,
} from "@/components/ui/slider";
import type { Locale } from "@/lib/i18n";
import { getCollectionProducts } from "@/lib/shopify/operations/products";

interface CollectionSliderProps {
  collection: string;
  collectionUrl?: string;
  limit: number;
  locale: Locale;
  title: string;
}

export async function CollectionSlider({
  collection,
  collectionUrl,
  limit,
  locale,
  title,
}: CollectionSliderProps) {
  const t = await getTranslations("product");
  const { products } = await getCollectionProducts({ collection, limit, locale });

  if (products.length === 0) return null;

  return (
    <Slider>
      <SliderHeader>
        <SliderTitle className="font-normal tracking-normal">{title}</SliderTitle>
        <div className="flex items-center gap-5">
          {collectionUrl && (
            <Link
              href={collectionUrl}
              prefetch={true}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("viewAll")}
            </Link>
          )}
          <SliderNav />
        </div>
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
