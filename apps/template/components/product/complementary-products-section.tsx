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
    <div className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted/50 px-2.5 py-2">
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <ul className="divide-y">
        {["a", "b", "c"].map((key) => (
          <li key={key} className="flex gap-2.5 p-2.5">
            <Skeleton className="size-16 shrink-0 rounded-none" />
            <div className="flex-1 min-w-0 flex flex-col gap-2 py-0.5">
              <Skeleton className="h-4 w-3/4 rounded-none" />
              <Skeleton className="h-3 w-12 rounded-none" />
            </div>
          </li>
        ))}
      </ul>
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
    <div className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted/50 px-2.5 py-2">
        <h2 className="text-sm font-medium">{t("pairsWellWith")}</h2>
      </div>
      <ul className="divide-y">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.handle}`}
              className="flex gap-2.5 p-2.5 group hover:bg-muted/40 transition-colors"
            >
              <div className="relative size-16 shrink-0 overflow-hidden bg-muted">
                {product.featuredImage?.url ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
                <p className="text-sm font-semibold text-foreground line-clamp-2 leading-4">
                  {product.title}
                </p>
                <Price
                  amount={product.price.amount}
                  currencyCode={product.price.currencyCode}
                  locale={locale}
                  className="text-xs text-muted-foreground"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
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
