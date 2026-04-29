import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { Price } from "@/components/product/price";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { getComplementaryProducts } from "@/lib/shopify/operations/products";

const LIMIT = 3;

function Fallback({ title }: { title: string }) {
  return (
    <div className="grid gap-2.5">
      <h2 className="text-sm font-medium text-foreground/70">{title}</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {["a", "b", "c"].map((key) => (
          <div key={key} className="grid gap-2">
            <Skeleton className="aspect-square w-full rounded-none" />
            <Skeleton className="h-3 w-full rounded-none" />
            <Skeleton className="h-3 w-12 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function Render({ handle, locale }: { handle: string; locale: Locale }) {
  const [t, all] = await Promise.all([
    getTranslations("product"),
    getComplementaryProducts(handle, locale),
  ]);

  const products = all.slice(0, LIMIT);
  if (products.length === 0) return null;

  return (
    <div className="grid gap-2.5">
      <h2 className="text-sm font-medium text-foreground/70">{t("pairsWellWith")}</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {products.map((product) => (
          <Link
            key={product.id}
            href={
              product.defaultVariantNumericId
                ? `/products/${product.handle}?variantId=${product.defaultVariantNumericId}`
                : `/products/${product.handle}`
            }
            className="grid gap-2 group"
          >
            <div className="relative aspect-square overflow-hidden bg-muted">
              {product.featuredImage?.url ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  fill
                  className="object-cover transition-opacity group-hover:opacity-90"
                  sizes="(min-width: 1024px) 12vw, 30vw"
                />
              ) : null}
            </div>
            <p className="text-xs font-medium text-foreground line-clamp-2 leading-4">
              {product.title}
            </p>
            <Price
              amount={product.price.amount}
              currencyCode={product.price.currencyCode}
              locale={locale}
              className="text-xs text-muted-foreground"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function ComplementaryProductsSection({
  handle,
  locale,
}: {
  handle: string;
  locale: Locale;
}) {
  const t = await getTranslations("product");
  return (
    <Suspense fallback={<Fallback title={t("pairsWellWith")} />}>
      <Render handle={handle} locale={locale} />
    </Suspense>
  );
}
