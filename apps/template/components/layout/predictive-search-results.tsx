"use client";

import { Search, Tag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { Price } from "@/components/product/price";
import type {
  PredictiveSearchCollection,
  PredictiveSearchProduct,
  PredictiveSearchResult,
  SearchSuggestion,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const easing = [0.32, 0.72, 0, 1] as const;

interface PredictiveSearchPanelProps {
  results: PredictiveSearchResult | null;
  isLoading: boolean;
  query: string;
  activeIndex: number;
  onSelectSuggestion: (text: string) => void;
  onNavigate: () => void;
  position?: "above" | "below";
  className?: string;
}

export function PredictiveSearchPanel({
  results,
  isLoading,
  query,
  activeIndex,
  onSelectSuggestion,
  onNavigate,
  position = "above",
  className,
}: PredictiveSearchPanelProps) {
  const t = useTranslations("nav.predictiveSearch");
  const show = query.trim().length > 0 && (results !== null || isLoading);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: position === "above" ? 8 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "above" ? 8 : -8 }}
          transition={{ duration: 0.2, ease: easing }}
          className={cn(
            "absolute left-0 right-0 z-50 overflow-hidden rounded-xl bg-popover/90 backdrop-blur-xl border border-border/50 shadow-lg",
            position === "above" && "bottom-full mb-2",
            position === "below" && "top-full mt-2",
            className,
          )}
          role="listbox"
          id="predictive-search-results"
          aria-label={t("suggestions")}
        >
          {isLoading && !results && (
            <div className="px-4 py-3">
              <LoadingSkeleton />
            </div>
          )}

          {results && (
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
              {results.queries.length > 0 && (
                <SearchSection title={t("suggestions")}>
                  {results.queries.map((suggestion, i) => (
                    <SuggestionItem
                      key={suggestion.text}
                      suggestion={suggestion}
                      active={activeIndex === i}
                      onClick={() => onSelectSuggestion(suggestion.text)}
                    />
                  ))}
                </SearchSection>
              )}

              {results.products.length > 0 && (
                <SearchSection title={t("products")}>
                  {results.products.map((product, i) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      active={activeIndex === results.queries.length + i}
                      onClick={onNavigate}
                    />
                  ))}
                </SearchSection>
              )}

              {results.collections.length > 0 && (
                <SearchSection title={t("collections")}>
                  {results.collections.map((collection, i) => (
                    <CollectionItem
                      key={collection.handle}
                      collection={collection}
                      active={activeIndex === results.queries.length + results.products.length + i}
                      onClick={onNavigate}
                    />
                  ))}
                </SearchSection>
              )}

              {results.products.length === 0 &&
                results.collections.length === 0 &&
                results.queries.length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {t("noResults", { query })}
                  </div>
                )}

              {query.trim() && (
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={onNavigate}
                  className="block px-4 py-3 text-sm font-medium text-primary hover:bg-accent/50 border-t border-border/30 transition-colors"
                >
                  {t("viewAll", { query: query.trim() })}
                </Link>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/30 last:border-b-0">
      <div className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SuggestionItem({
  suggestion,
  active,
  onClick,
}: {
  suggestion: SearchSuggestion;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-active={active}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent/50 data-[active=true]:bg-accent/50 transition-colors cursor-pointer"
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" />
      <span
        className="truncate [&_b]:font-semibold"
        // oxlint-disable-next-line react/no-danger -- styledText from search API contains safe markup (<b> tags)
        dangerouslySetInnerHTML={{ __html: suggestion.styledText }}
      />
    </button>
  );
}

function ProductItem({
  product,
  active,
  onClick,
}: {
  product: PredictiveSearchProduct;
  active: boolean;
  onClick: () => void;
}) {
  const locale = useLocale();

  return (
    <Link
      href={`/products/${product.handle}`}
      role="option"
      aria-selected={active}
      data-active={active}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 hover:bg-accent/50 data-[active=true]:bg-accent/50 transition-colors"
    >
      {product.featuredImage ? (
        <Image
          src={product.featuredImage.url}
          alt={product.featuredImage.altText}
          width={40}
          height={40}
          className="size-10 rounded-md object-cover bg-muted shrink-0"
        />
      ) : (
        <div className="size-10 rounded-md bg-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground truncate">{product.title}</div>
        {product.vendor && (
          <div className="text-xs text-muted-foreground truncate">{product.vendor}</div>
        )}
      </div>
      <Price
        amount={product.price.amount}
        currencyCode={product.price.currencyCode}
        locale={locale}
        className="text-sm font-medium shrink-0"
      />
    </Link>
  );
}

function CollectionItem({
  collection,
  active,
  onClick,
}: {
  collection: PredictiveSearchCollection;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={`/collections/${collection.handle}`}
      role="option"
      aria-selected={active}
      data-active={active}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent/50 data-[active=true]:bg-accent/50 transition-colors"
    >
      <Tag className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{collection.title}</span>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
        <div key={key} className="flex items-center gap-3">
          <div className="size-10 rounded-md bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
