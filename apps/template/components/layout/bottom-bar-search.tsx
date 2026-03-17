"use client";

import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef } from "react";

import { SpeechInput } from "@/components/ai-elements/speech-input";
import { usePredictiveSearch } from "@/hooks/use-predictive-search";

import { PredictiveSearchPanel } from "./predictive-search-results";

interface BottomBarSearchProps {
  onClose: () => void;
}

export function BottomBarSearch({ onClose }: BottomBarSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");

  const { query, setQuery, results, isLoading, totalItems, activeIndex, setActiveIndex, reset } =
    usePredictiveSearch(locale);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  function close() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value?.trim();
    if (!q) return;
    reset();
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
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
      close();
      startTransition(() => {
        router.push(`/products/${product.handle}`);
      });
      return;
    }

    const collection = results.collections[activeIndex - queriesLen - productsLen];
    if (collection) {
      close();
      startTransition(() => {
        router.push(`/collections/${collection.handle}`);
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
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
    <>
      <PredictiveSearchPanel
        results={results}
        isLoading={isLoading}
        query={query}
        activeIndex={activeIndex}
        onSelectSuggestion={(text) => {
          setQuery(text);
          if (inputRef.current) inputRef.current.value = text;
        }}
        onNavigate={close}
        position="above"
      />

      <Search className="size-4 shrink-0 text-foreground opacity-50" />
      <form onSubmit={handleSubmit} className="contents">
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
          aria-controls="predictive-search-results"
          aria-activedescendant={
            activeIndex >= 0 ? `predictive-search-item-${activeIndex}` : undefined
          }
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent text-base md:text-sm text-foreground placeholder:text-foreground/50 focus:outline-none"
        />
        <SpeechInput
          type="button"
          lang={locale}
          size="icon-sm"
          variant="ghost"
          className="shrink-0 bg-transparent text-foreground/50 hover:bg-transparent hover:text-foreground"
          onTranscriptionChange={(text) => {
            if (inputRef.current) {
              inputRef.current.value = text;
            }
            startTransition(() => {
              router.push(`/search?q=${encodeURIComponent(text)}`);
            });
          }}
        />
        <button
          type="button"
          onClick={close}
          className="size-10 shrink-0 flex items-center justify-center rounded-full bg-background/50"
        >
          <X className="size-4 text-foreground opacity-50" />
        </button>
      </form>
    </>
  );
}
