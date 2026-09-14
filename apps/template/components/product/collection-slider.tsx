import { cn } from "cn";
import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card/product-card";
import Link from "@/components/ui/link";
import { Slider, SliderContent, SliderHeader, SliderItem, SliderNav } from "@/components/ui/slider";
import { getInitialCollectionProducts } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";
import { getSearchIndexProducts } from "@/lib/product/server";

interface CollectionSliderProps {
  collection?: string;
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
  const { products } = collection
    ? await getInitialCollectionProducts({ collection, limit, locale })
    : await getSearchIndexProducts({ limit, locale });

  if (products.length === 0) return null;

  return (
    <Slider className="sm:overflow-x-clip sm:contain-[paint]">
      <SliderHeader>
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        <div className="flex items-center gap-5">
          {collectionUrl && (
            <Link
              href={collectionUrl}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("viewAll")}
            </Link>
          )}
          <SliderNav className="hidden lg:flex" />
        </div>
      </SliderHeader>
      <SliderContent
        className={cn(
          "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-none auto-cols-[58.33vw] px-5 scroll-px-5",
          "sm:left-auto sm:right-auto sm:mx-0 sm:w-full sm:max-w-full sm:auto-cols-[calc((100%-1.25rem)/2)] sm:px-0 sm:scroll-px-0",
          "lg:auto-cols-[calc((100%-2.5rem)/3)] xl:auto-cols-[calc((100%-3.75rem)/4)] 2xl:auto-cols-[calc((100%-5rem)/5)] 3xl:auto-cols-[calc((100%-6.25rem)/6)] 4xl:auto-cols-[calc((100%-8.75rem)/8)]",
        )}
      >
        {products.map((product) => (
          <SliderItem key={product.id}>
            <ProductCard product={product} locale={locale} outOfStockText={t("outOfStock")} />
          </SliderItem>
        ))}
      </SliderContent>
    </Slider>
  );
}
