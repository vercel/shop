"use client";

import { ChevronLeft, ChevronRight, LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  useFilterPending,
  useFilterTransition,
} from "@/components/collections/filter-pending-context";

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
    <div className="flex items-center justify-end gap-1 mt-8">
      {isFirstPage ? (
        <button type="button" disabled aria-label={t("first")} className="text-foreground/30">
          <ChevronLeft className="size-6" aria-hidden="true" />
        </button>
      ) : (
        <Link
          href={firstPageHref}
          onClick={(e) => navigate(e, firstPageHref)}
          aria-label={t("first")}
          className={isPending ? "pointer-events-none text-foreground/30" : "text-foreground"}
        >
          {isPending ? (
            <LoaderCircleIcon className="size-6 animate-spin" />
          ) : (
            <ChevronLeft className="size-6" aria-hidden="true" />
          )}
        </Link>
      )}

      {!hasNextPage || !nextPageHref ? (
        <button type="button" disabled aria-label={t("next")} className="text-foreground/30">
          <ChevronRight className="size-6" aria-hidden="true" />
        </button>
      ) : (
        <Link
          href={nextPageHref}
          onClick={(e) => navigate(e, nextPageHref)}
          aria-label={t("next")}
          className={isPending ? "pointer-events-none text-foreground/30" : "text-foreground"}
        >
          {isPending ? (
            <LoaderCircleIcon className="size-6 animate-spin" />
          ) : (
            <ChevronRight className="size-6" aria-hidden="true" />
          )}
        </Link>
      )}
    </div>
  );
}
