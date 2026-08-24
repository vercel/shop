"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { buildOptionUrl, type SelectedOptions } from "@/lib/product";

interface VariantSelectionContextValue {
  isPending: boolean;
  optimisticOptions: SelectedOptions | null;
  reconcile: (selectedOptions: SelectedOptions) => void;
  selectOption: (selectedOptions: SelectedOptions, name: string, value: string) => void;
}

const VariantSelectionContext = createContext<VariantSelectionContextValue | null>(null);

interface VariantSelectionProviderProps {
  children: ReactNode;
  handle: string;
  selectedOptionsPromise: Promise<SelectedOptions>;
}

export function VariantSelectionProvider({
  children,
  handle,
  selectedOptionsPromise,
}: VariantSelectionProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticOptions, setOptimisticOptions] = useState<SelectedOptions | null>(null);
  const optimisticOptionsRef = useRef(optimisticOptions);

  const reconcile = useCallback((selectedOptions: SelectedOptions) => {
    const currentOptions = optimisticOptionsRef.current;
    if (!currentOptions || JSON.stringify(currentOptions) !== JSON.stringify(selectedOptions))
      return;
    optimisticOptionsRef.current = null;
    setOptimisticOptions(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    selectedOptionsPromise.then((selectedOptions) => {
      if (!cancelled) reconcile(selectedOptions);
    });
    return () => {
      cancelled = true;
    };
  }, [reconcile, selectedOptionsPromise]);

  const selectOption = useCallback(
    (selectedOptions: SelectedOptions, name: string, value: string) => {
      const nextOptions = {
        ...(optimisticOptionsRef.current ?? selectedOptions),
        [name]: value,
      };
      optimisticOptionsRef.current = nextOptions;
      startTransition(() => {
        setOptimisticOptions(nextOptions);
        router.replace(buildOptionUrl(handle, nextOptions, name, value), { scroll: false });
      });
    },
    [handle, router],
  );

  return (
    <VariantSelectionContext value={{ isPending, optimisticOptions, reconcile, selectOption }}>
      {children}
    </VariantSelectionContext>
  );
}

export function useVariantSelection() {
  const context = useContext(VariantSelectionContext);
  if (!context) throw new Error("useVariantSelection must be used within VariantSelectionProvider");
  return context;
}
