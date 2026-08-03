import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { Container } from "@/components/ui/container";
import { TONES, type ToneId } from "@/lib/home/tones";
import type { Locale } from "@/lib/i18n";
import { getCollection } from "@/lib/shopify/operations/collections";
import { getCollectionProducts } from "@/lib/shopify/operations/products";
import { cn } from "@/lib/utils";

interface CollectionRailProps {
  collection: string;
  eyebrow: string;
  limit: number;
  locale: Locale;
  tone: ToneId;
}

export async function CollectionRail({
  collection,
  eyebrow,
  limit,
  locale,
  tone,
}: CollectionRailProps) {
  const [collectionData, t] = await Promise.all([
    getCollection({ handle: collection, locale }),
    getTranslations("product"),
  ]);
  const title = collectionData?.title ?? collection;
  const toneClasses = TONES[tone];

  return (
    <section className={cn("py-10 lg:py-16", toneClasses.bg, toneClasses.fg)}>
      <Container className="px-5 lg:px-10">
        <div className="mb-5 flex items-end justify-between gap-5">
          <div className="grid gap-2.5">
            <p
              className={cn("text-xs font-semibold uppercase tracking-[0.2em]", toneClasses.subtle)}
            >
              {eyebrow}
            </p>
            <h2 className="text-2xl sm:text-3xl">{title}</h2>
          </div>
          <Link
            href={`/collections/${collection}`}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 text-sm font-medium underline-offset-4 transition-colors hover:underline",
              toneClasses.hoverLink,
            )}
          >
            {t("viewAll")}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <Suspense fallback={<RailGridSkeleton count={limit} />}>
          <RailGrid
            collection={collection}
            limit={limit}
            locale={locale}
            outOfStockText={t("outOfStock")}
            title={title}
            tone={tone}
            viewAllLabel={t("viewAll")}
          />
        </Suspense>
      </Container>
    </section>
  );
}

function RailLeadTile({
  collection,
  title,
  tone,
  viewAllLabel,
}: {
  collection: string;
  title: string;
  tone: ToneId;
  viewAllLabel: string;
}) {
  const toneClasses = TONES[tone];

  return (
    <Link
      href={`/collections/${collection}`}
      className={cn(
        "group flex h-full flex-col justify-between gap-5 rounded-lg border p-5 transition-colors",
        toneClasses.pillBorder,
        toneClasses.tileHoverBg,
      )}
    >
      <div className="grid gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
          {viewAllLabel}
        </span>
        <span className="text-xl sm:text-2xl">{title}</span>
      </div>
      <span
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full transition-transform group-hover:translate-x-1",
          toneClasses.solidButton,
        )}
      >
        <ArrowRight aria-hidden className="size-4" />
      </span>
    </Link>
  );
}

async function RailGrid({
  collection,
  limit,
  locale,
  outOfStockText,
  title,
  tone,
  viewAllLabel,
}: {
  collection: string;
  limit: number;
  locale: Locale;
  outOfStockText: string;
  title: string;
  tone: ToneId;
  viewAllLabel: string;
}) {
  // The store's search index ignores `collection:` filters, so rails go through the
  // collection products connection directly.
  const { products } = await getCollectionProducts({ collection, limit, locale });

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
      <RailLeadTile collection={collection} title={title} tone={tone} viewAllLabel={viewAllLabel} />
      {products.map((product) => (
        <ProductCard
          key={product.id}
          locale={locale}
          outOfStockText={outOfStockText}
          product={product}
        />
      ))}
    </div>
  );
}

function RailGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
      <div className="rounded-lg border border-background/20" />
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
