"use client";

import { createContext, useContext, useTransition } from "react";
import { cn } from "@/lib/utils";

const FilterTransitionContext = createContext<React.TransitionStartFunction>(
  (callback) => callback(),
);
const FilterTransitionPendingContext = createContext(false);
const FilterPendingContext = createContext(false);

export function FilterTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <FilterTransitionContext value={startTransition}>
      <FilterTransitionPendingContext value={isPending}>
        {children}
      </FilterTransitionPendingContext>
    </FilterTransitionContext>
  );
}

export function FilterPendingScope({
  children,
}: {
  children: React.ReactNode;
}) {
  const isPending = useContext(FilterTransitionPendingContext);

  return (
    <FilterPendingContext value={isPending}>{children}</FilterPendingContext>
  );
}

export function useFilterTransition() {
  return useContext(FilterTransitionContext);
}

export function useFilterPending() {
  return useContext(FilterPendingContext);
}

export function ProductGridPendingOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  const isPending = useFilterPending();

  return (
    <div
      className={cn(
        "transition-opacity duration-200",
        isPending && "opacity-50 pointer-events-none",
      )}
    >
      {children}
    </div>
  );
}
