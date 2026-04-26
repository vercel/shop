"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";

import { usePredictiveSearch } from "@/hooks/use-predictive-search";
import type { Locale, NamespaceMessages } from "@/lib/i18n";

import { PredictiveSearchPanel } from "../action-bar/predictive-search-results";

interface SearchClientProps {
  labels: NamespaceMessages<"nav">;
  locale: Locale;
}

export function SearchClient({ labels, locale }: SearchClientProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPanel, setShowPanel] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { query, setQuery, results, isLoading, totalItems, activeIndex, setActiveIndex, reset } =
    usePredictiveSearch(locale);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const q = formData.get("q") as string;

    if (!q || !q.trim()) return;

    reset();
    setShowPanel(false);
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    });
  }

  function navigateToActiveItem() {
    if (!results || activeIndex < 0) return;

    const queriesLen = results.queries.length;
    const productsLen = results.products.length;

    if (activeIndex < queriesLen) {
      const suggestion = results.queries[activeIndex];
      if (inputRef.current) inputRef.current.value = suggestion.text;
      setQuery(suggestion.text);
      return;
    }

    if (activeIndex < queriesLen + productsLen) {
      const product = results.products[activeIndex - queriesLen];
      reset();
      setShowPanel(false);
      startTransition(() => {
        router.push(`/products/${product.handle}`);
      });
      return;
    }

    const collection = results.collections[activeIndex - queriesLen - productsLen];
    if (collection) {
      reset();
      setShowPanel(false);
      startTransition(() => {
        router.push(`/collections/${collection.handle}`);
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setShowPanel(false);
      reset();
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown" && totalItems > 0) {
      e.preventDefault();
      setActiveIndex(Math.min(activeIndex + 1, totalItems - 1));
      return;
    }
    if (e.key === "ArrowUp" && totalItems > 0) {
      e.preventDefault();
      setActiveIndex(Math.max(activeIndex - 1, -1));
      return;
    }
    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigateToActiveItem();
    }
  }

  return (
    <div className="relative w-full">
      <form method="GET" action="/search" onSubmit={handleSubmit}>
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          id="q"
          type="text"
          name="q"
          role="combobox"
          placeholder={labels.searchPlaceholder}
          className="w-full h-10 pl-10 pr-5 rounded-full bg-muted border-0 text-base md:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          maxLength={100}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim()) {
              setShowPanel(true);
            }
          }}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
            }
            if (query.trim()) {
              setShowPanel(true);
            }
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => setShowPanel(false), 150);
          }}
          onKeyDown={handleKeyDown}
          aria-expanded={showPanel && !!results}
          aria-controls="predictive-search-results"
          aria-activedescendant={
            activeIndex >= 0 ? `predictive-search-item-${activeIndex}` : undefined
          }
        />
      </form>
      {showPanel && (
        <PredictiveSearchPanel
          results={results}
          isLoading={isLoading}
          labels={labels.predictiveSearch}
          locale={locale}
          query={query}
          activeIndex={activeIndex}
          onSelectSuggestion={(text) => {
            setQuery(text);
            if (inputRef.current) inputRef.current.value = text;
          }}
          onNavigate={() => {
            setShowPanel(false);
            reset();
          }}
          position="below"
        />
      )}
    </div>
  );
}
