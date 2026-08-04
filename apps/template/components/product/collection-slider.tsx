import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
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

  return (
    <Slider>
      <SliderHeader>
        <SliderTitle className="font-normal tracking-normal">{title}</SliderTitle>
        <div className="flex items-center gap-5">
          {collectionUrl && (
            <Link
              href={collectionUrl}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("viewAll")}
            </Link>
          )}
          <SliderNav />
        </div>
      </SliderHeader>
      <Suspense fallback={<CollectionSliderSkeleton count={limit} />}>
        <CollectionSliderContent
          collection={collection}
          limit={limit}
          locale={locale}
          outOfStockText={t("outOfStock")}
        />
      </Suspense>
    </Slider>
  );
}

async function CollectionSliderContent({
  collection,
  limit,
  locale,
  outOfStockText,
}: {
  collection: string;
  limit: number;
  locale: Locale;
  outOfStockText: string;
}) {
  const { products } = await getCollectionProducts({ collection, limit, locale });
  if (products.length === 0) return null;

  return (
    <SliderContent>
      {products.map((product) => (
        <SliderItem key={product.id}>
          <ProductCard product={product} locale={locale} outOfStockText={outOfStockText} />
        </SliderItem>
      ))}
    </SliderContent>
  );
}

function CollectionSliderSkeleton({ count }: { count: number }) {
  return (
    <SliderContent>
      {Array.from({ length: count }, (_, index) => (
        <SliderItem key={index}>
          <ProductCardSkeleton />
        </SliderItem>
      ))}
    </SliderContent>
  );
}
