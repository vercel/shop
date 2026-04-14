"use client";

import { ChevronLeftIcon, ChevronRightIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  useFilterPending,
  useFilterTransition,
} from "@/components/collections/filter-pending-context";
import { Button } from "@/components/ui/button";
import { ShopLink as Link } from "@/components/ui/shop-link";

export function CollectionsPagination({
  hasNextPage,
  endCursor,
  isFirstPage,
}: {
  hasNextPage: boolean;
  endCursor: string | null;
  isFirstPage: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("search.pagination");
  const isPending = useFilterPending();
  const startFilterTransition = useFilterTransition();

  if (!hasNextPage && isFirstPage) return null;

  const firstPageHref = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cursor");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();

  const nextPageHref = endCursor
    ? (() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("cursor", endCursor);
        return `${pathname}?${params.toString()}`;
      })()
    : null;

  const navigate = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    startFilterTransition(() => {
      router.push(href);
    });
  };

  return (
    <div className="flex items-center justify-end gap-2 mt-8 pt-8 border-t">
      {isFirstPage ? (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          {t("first")}
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={isPending} asChild>
          <Link href={firstPageHref} onClick={(e) => navigate(e, firstPageHref)}>
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            {t("first")}
            {isPending && <LoaderCircleIcon className="size-4 animate-spin" />}
          </Link>
        </Button>
      )}

      {!hasNextPage || !nextPageHref ? (
        <Button variant="outline" size="sm" disabled>
          {t("next")}
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={isPending} asChild>
          <Link href={nextPageHref} onClick={(e) => navigate(e, nextPageHref)}>
            {t("next")}
            {isPending && <LoaderCircleIcon className="size-4 animate-spin" />}
            {!isPending && <ChevronRightIcon className="h-4 w-4 ml-1" />}
          </Link>
        </Button>
      )}
    </div>
  );
}
