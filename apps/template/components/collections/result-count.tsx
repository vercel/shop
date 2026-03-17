import {
  type CollectionResultsData,
  getExactCollectionResultCount,
} from "./data";

import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function Fallback() {
  return <Skeleton className="h-4 w-24" />;
}

async function Render({
  collectionResultsDataPromise,
}: {
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  const [{ cursor, result }, t] = await Promise.all([
    collectionResultsDataPromise,
    getTranslations("search"),
  ]);
  const exactCount = getExactCollectionResultCount({ cursor, result });

  if (exactCount === undefined || exactCount === 0) return null;

  return (
    <p className="text-sm text-muted-foreground">
      {t("resultCount", { count: exactCount })}
    </p>
  );
}

export function CollectionResultCount({
  collectionResultsDataPromise,
}: {
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render collectionResultsDataPromise={collectionResultsDataPromise} />
    </Suspense>
  );
}
