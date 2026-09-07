import type { OptionValueSwatch } from "@/lib/product/types";

export type FilterPresentation = "image" | "swatch" | "text";

export type FilterType = "boolean" | "list" | "price";

export interface FilterValue {
  count: number;
  id: string;
  input: string;
  label: string;
  swatch?: OptionValueSwatch;
  value: string;
}

export interface Filter {
  id: string;
  label: string;
  paramKey: string;
  presentation?: FilterPresentation;
  type: FilterType;
  values: FilterValue[];
}

export interface PriceRange {
  currencyCode?: string;
  max: number;
  min: number;
}
