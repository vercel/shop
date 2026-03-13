import {
  getCollectionResultsData,
  getCollectionSearchState,
} from "@/components/collections/data";
import { CollectionHeader } from "@/components/collections/header";
import { CollectionResultsSection } from "@/components/collections/results";
import { CollectionStructuredData } from "@/components/collections/structured-data";
import { Container } from "@/components/layout/container";
import type { Locale } from "@/lib/i18n";
import type { getCollection } from "@/lib/shopify/operations/collections";
import { FilterTransitionProvider } from "./filter-pending-context";

export function CollectionDetailPage({
  handlePromise,
  collectionPromise,
  locale,
  searchParams,
}: {
  handlePromise: Promise<string>;
  collectionPromise: Promise<Awaited<ReturnType<typeof getCollection>>>;
  locale: Locale;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchStatePromise = getCollectionSearchState(searchParams);
  const collectionResultsDataPromise = getCollectionResultsData({
    handlePromise,
    locale,
    searchStatePromise,
  });

  return (
    <FilterTransitionProvider>
      <Container className="pt-3 md:pt-8">
        <CollectionStructuredData
          locale={locale}
          handlePromise={handlePromise}
          collectionPromise={collectionPromise}
        />

        <CollectionHeader
          handlePromise={handlePromise}
          locale={locale}
          collectionPromise={collectionPromise}
          collectionResultsDataPromise={collectionResultsDataPromise}
        />

        <CollectionResultsSection
          locale={locale}
          collectionResultsDataPromise={collectionResultsDataPromise}
        />
      </Container>
    </FilterTransitionProvider>
  );
}
