import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

import {
  type ProductsGridColumns,
  ProductsGridSection,
  ProductsGridSkeleton,
} from "@/components/product/products-grid";
import type { Locale } from "@/lib/i18n";
import {
  getCollectionProducts,
  getFilteredCatalogProducts,
} from "@/lib/shopify/operations/products";
import type { SearchParamsPromise } from "@/lib/types";

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
  fallbackSortKey: string;
  limit: number;
  locale: Locale;
  rememberedCollectionCookie: string;
  searchParams: SearchParamsPromise;
  title: string;
}

export async function PickedForYou({
  campaignCollections,
  columns,
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
  fallbackSortKey,
  limit,
  locale,
  outOfStockText,
  rememberedCollectionCookie,
  searchParams,
}: {
  campaignCollections: readonly string[];
  columns?: ProductsGridColumns;
  fallbackSortKey: string;
  limit: number;
  locale: Locale;
  outOfStockText: string;
  rememberedCollectionCookie: string;
  searchParams: SearchParamsPromise;
}) {
  // Reading searchParams and cookies opts this grid into PPR's dynamic hole so it
  // streams in behind the skeleton.
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);

  // A remembered collection (from a cookie set on a prior collection page) follows the
  // campaign override but takes precedence over the fallback vector.
  const rememberedCollection = cookieStore.get(rememberedCollectionCookie)?.value;

  // A ?utm_campaign= match swaps in that collection; otherwise the remembered
  // collection, or the fallback vector (catalog sort key).
  const collectionHandle =
    resolveCampaignCollection(params, campaignCollections) ?? rememberedCollection;

  const { products } = collectionHandle
    ? await getCollectionProducts({ collection: collectionHandle, limit, locale })
    : await getFilteredCatalogProducts({ limit, locale, sortKey: fallbackSortKey });

  if (products.length === 0) return null;

  return (
    <ProductsGridSection
      columns={columns}
      locale={locale}
      outOfStockText={outOfStockText}
      products={products}
    />
  );
}
