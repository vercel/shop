"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { predictiveSearchAction } from "@/components/layout/predictive-search-action";
import type { PredictiveSearchResult } from "@/lib/types";

const DEBOUNCE_MS = 300;

export function usePredictiveSearch(locale: string) {
  const [query, setQueryRaw] = useState("");
  const [results, setResults] = useState<PredictiveSearchResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const generationRef = useRef(0);

  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }

    const generation = ++generationRef.current;

    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const data = await predictiveSearchAction(trimmed, locale);
          if (generationRef.current === generation) {
            setResults(data);
          }
        } catch {
          // Silently fail — user can still press Enter for full search
        }
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, locale]);

  const totalItems =
    (results?.queries.length ?? 0) +
    (results?.products.length ?? 0) +
    (results?.collections.length ?? 0);

  const reset = useCallback(() => {
    setQueryRaw("");
    setResults(null);
    setActiveIndex(-1);
    generationRef.current++;
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading: isPending,
    totalItems,
    activeIndex,
    setActiveIndex,
    reset,
  };
}
