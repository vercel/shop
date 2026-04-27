"use client";

import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useEffect, useRef, useState } from "react";

import { Price } from "@/components/product/price";
import { Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePredictiveSearch } from "@/hooks/use-predictive-search";
import type { PredictiveSearchProduct, SearchSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SearchModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SearchTrigger />
      <SearchDialogContent onClose={() => setOpen(false)} />
    </Dialog>
  );
}

function SearchTrigger() {
  const t = useTranslations("nav");

  return (
    <DialogTrigger asChild>
      <button
        type="button"
        className="flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
      >
        <Search className="size-5" />
        <span className="sr-only">{t("search")}</span>
      </button>
    </DialogTrigger>
  );
}

function SearchDialogContent({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");

  const { query, setQuery, results, isLoading, activeIndex, setActiveIndex, reset } =
    usePredictiveSearch(locale);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      requestAnimationFrame(() => onClose());
    },
    [router, onClose],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value?.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  // Only queries and products are rendered — exclude collections from keyboard nav
  const visibleItems = (results?.queries.length ?? 0) + (results?.products.length ?? 0);

  function navigateToActiveItem() {
    if (!results || activeIndex < 0) return;

    const queriesLen = results.queries.length;

    if (activeIndex < queriesLen) {
      const suggestion = results.queries[activeIndex];
      if (inputRef.current) inputRef.current.value = suggestion.text;
      setQuery(suggestion.text);
      return;
    }

    const product = results.products[activeIndex - queriesLen];
    if (product) {
      navigate(`/products/${product.handle}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" && visibleItems > 0) {
      e.preventDefault();
      setActiveIndex(Math.min(activeIndex + 1, visibleItems - 1));
      return;
    }
    if (e.key === "ArrowUp" && visibleItems > 0) {
      e.preventDefault();
      setActiveIndex(Math.max(activeIndex - 1, -1));
      return;
    }
    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigateToActiveItem();
    }
  }

  const show = query.trim().length > 0 && (results !== null || isLoading);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-60 bg-black/30 backdrop-blur-sm" />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className="fixed inset-0 z-60 flex justify-center pt-[15vh] px-4 outline-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <div className="w-full max-w-xl h-fit">
          <DialogTitle className="sr-only">{t("search")}</DialogTitle>
          <div className="bg-background rounded-xl shadow-lg overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
            {/* Search input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
              <Search className="size-4 shrink-0 text-foreground/40" />
              <input
                ref={inputRef}
                type="text"
                name="q"
                role="combobox"
                placeholder={t("searchPlaceholder")}
                maxLength={100}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-expanded={!!results}
                aria-controls="search-modal-results"
                aria-activedescendant={
                  activeIndex >= 0 ? `search-modal-item-${activeIndex}` : undefined
                }
                autoComplete="off"
                className="flex-1 min-w-0 bg-transparent text-base text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    if (inputRef.current) {
                      inputRef.current.value = "";
                      inputRef.current.focus();
                    }
                  }}
                  className="shrink-0 text-sm text-foreground/60 hover:text-foreground transition-colors"
                >
                  {t("searchClear")}
                </button>
              )}
              <DialogPrimitive.Close className="shrink-0 flex items-center justify-center rounded-full text-foreground/40 hover:text-foreground transition-colors">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </form>

            {/* Results */}
            {show && (
              <div
                id="search-modal-results"
                role="listbox"
                className="border-t border-border/30 max-h-[60vh] overflow-y-auto overscroll-contain"
              >
                {isLoading && !results && <LoadingSkeleton />}

                {results && (
                  <>
                    {results.queries.length > 0 && (
                      <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
                        {results.queries.map((suggestion, i) => (
                          <SuggestionChip
                            key={suggestion.text}
                            suggestion={suggestion}
                            active={activeIndex === i}
                            onClick={() => {
                              setQuery(suggestion.text);
                              if (inputRef.current) inputRef.current.value = suggestion.text;
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {results.products.length > 0 && (
                      <div>
                        <div className="px-4 pt-3 pb-1.5 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                          {t("predictiveSearch.products")}
                        </div>
                        {results.products.map((product, i) => (
                          <ProductResult
                            key={product.id}
                            product={product}
                            active={activeIndex === results.queries.length + i}
                            onNavigate={navigate}
                          />
                        ))}
                      </div>
                    )}

                    {results.products.length === 0 &&
                      results.collections.length === 0 &&
                      results.queries.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-foreground/50">
                          {t("predictiveSearch.noResults", { query })}
                        </div>
                      )}

                    {query.trim() &&
                      (results.products.length > 0 || results.queries.length > 0) && (
                        <div className="px-4 py-3 flex justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                            }
                            className="inline-flex items-center justify-center rounded-lg bg-foreground text-background text-sm font-medium h-9 px-5 hover:bg-foreground/90 transition-colors"
                          >
                            {t("predictiveSearch.viewAllShort")}
                          </button>
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function SuggestionChip({
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
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent text-foreground border-border hover:bg-accent",
      )}
    >
      {suggestion.text}
    </button>
  );
}

function ProductResult({
  product,
  active,
  onNavigate,
}: {
  product: PredictiveSearchProduct;
  active: boolean;
  onNavigate: (href: string) => void;
}) {
  const locale = useLocale();

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-active={active}
      onClick={() => onNavigate(`/products/${product.handle}`)}
      className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-accent/50 data-[active=true]:bg-accent/50 transition-colors text-left cursor-pointer"
    >
      {product.featuredImage ? (
        <Image
          src={product.featuredImage.url}
          alt={product.featuredImage.altText}
          width={56}
          height={56}
          className="size-14 object-cover bg-muted shrink-0"
        />
      ) : (
        <div className="size-14 bg-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground truncate">{product.title}</div>
        <Price
          amount={product.price.amount}
          currencyCode={product.price.currencyCode}
          locale={locale}
          className="text-sm text-foreground/70"
        />
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-3 space-y-3">
      {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
        <div key={key} className="flex items-center gap-3">
          <div className="size-14 bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
