import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { PickedForYouClient } from "@/components/product/picked-for-you-client";
import {
  type ProductsGridColumns,
  ProductsGridSection,
  ProductsGridSkeleton,
} from "@/components/product/products-grid";
import type { Locale } from "@/lib/i18n";
import {
  getCollectionProducts,
  getFilteredCatalogProducts,
} from "@/lib/shopify/operations/products/server";

// A ?utm_campaign= value selects a collection only when it's in the caller's allowlist;
// anything else (missing, unknown, multi-valued) falls through to the regular resolution.
function resolveCampaignCollection(
  params: Record<string, string | string[] | undefined> | undefined,
  allowed: readonly string[] | undefined,
): string | undefined {
  if (!params || !allowed?.length) return undefined;
  const value = params.utm_campaign;
  const campaign = Array.isArray(value) ? value[0] : value;
  return campaign && allowed.includes(campaign) ? campaign : undefined;
}

interface PickedForYouProps {
  campaignCollections: readonly string[];
  columns?: ProductsGridColumns;
  defaultCollection?: string;
  fallbackSortKey: string;
  limit: number;
  locale: Locale;
  rememberedCollectionCookie: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  title: string;
}

export async function PickedForYou({
  campaignCollections,
  columns,
  defaultCollection,
  fallbackSortKey,
  limit,
  locale,
  rememberedCollectionCookie,
  searchParams,
  title,
}: PickedForYouProps) {
  const t = await getTranslations("product");

  return (
    <div className="grid gap-4">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <Suspense fallback={<ProductsGridSkeleton columns={columns} count={limit} />}>
        <PickedForYouContent
          campaignCollections={campaignCollections}
          columns={columns}
          defaultCollection={defaultCollection}
          fallbackSortKey={fallbackSortKey}
          limit={limit}
          locale={locale}
          outOfStockText={t("outOfStock")}
          rememberedCollectionCookie={rememberedCollectionCookie}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

async function PickedForYouContent({
  campaignCollections,
  columns,
  defaultCollection,
  fallbackSortKey,
  limit,
  locale,
  outOfStockText,
  rememberedCollectionCookie,
  searchParams,
}: {
  campaignCollections: readonly string[];
  columns?: ProductsGridColumns;
  defaultCollection?: string;
  fallbackSortKey: string;
  limit: number;
  locale: Locale;
  outOfStockText: string;
  rememberedCollectionCookie: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const campaign = resolveCampaignCollection(await searchParams, campaignCollections);

  async function load() {
    "use server";

    const collection = (await cookies()).get(rememberedCollectionCookie)?.value;
    const handle = campaign ?? collection ?? defaultCollection;
    const { products } = handle
      ? await getCollectionProducts({ collection: handle, limit, locale })
      : await getFilteredCatalogProducts({ limit, locale, sortKey: fallbackSortKey });

    return {
      collection,
      content: products.length ? (
        <ProductsGridSection
          columns={columns}
          locale={locale}
          outOfStockText={outOfStockText}
          products={products}
        />
      ) : null,
    };
  }

  const initial = await load();
  if (campaign) return initial.content;

  return (
    <PickedForYouClient
      cookieName={rememberedCollectionCookie}
      fallback={<ProductsGridSkeleton columns={columns} count={limit} />}
      initial={initial}
      load={load}
    />
  );
}
