"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";

type SelectedOptions = Record<string, string>;

type VariantStateContext = {
  selectedOptions: SelectedOptions;
  setSelectedOptions: Dispatch<SetStateAction<SelectedOptions>>;
};

const PdpVariantStateContext = createContext<VariantStateContext | null>(null);

// TODO: Skill
export function PdpVariantStateProvider({
  children,
  initialSelectedOptions,
}: {
  children: ReactNode;
  initialSelectedOptions: SelectedOptions;
}) {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(
    initialSelectedOptions,
  );

  return (
    <PdpVariantStateContext.Provider
      value={{ selectedOptions, setSelectedOptions }}
    >
      {children}
    </PdpVariantStateContext.Provider>
  );
}

export function usePdpVariantState() {
  const context = useContext(PdpVariantStateContext);
  if (!context) {
    throw new Error(
      "usePdpVariantState must be used within PdpVariantStateProvider",
    );
  }
  return context;
}
