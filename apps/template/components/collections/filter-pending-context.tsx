"use client";

import { cn } from "cn";
import type { ReactNode, TransitionStartFunction } from "react";
import { createContext, useContext, useTransition } from "react";

const FilterTransitionContext = createContext<TransitionStartFunction>((callback) => callback());
const FilterTransitionPendingContext = createContext(false);
const FilterPendingContext = createContext(false);

export function FilterTransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();

  return (
    <FilterTransitionContext value={startTransition}>
      <FilterTransitionPendingContext value={isPending}>{children}</FilterTransitionPendingContext>
    </FilterTransitionContext>
  );
}

export function FilterPendingScope({ children }: { children: ReactNode }) {
  const isPending = useContext(FilterTransitionPendingContext);

  return <FilterPendingContext value={isPending}>{children}</FilterPendingContext>;
}

export function useFilterTransition() {
  return useContext(FilterTransitionContext);
}

function useFilterPending() {
  return useContext(FilterPendingContext);
}

export function ProductGridPendingOverlay({ children }: { children: ReactNode }) {
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
