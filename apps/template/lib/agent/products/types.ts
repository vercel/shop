import type { Money } from "@/lib/money/types";
import type { OptionValueSwatch } from "@/lib/product/types";

export interface AgentProduct {
  available: boolean;
  compareAtPrice: Money | null;
  handle: string;
  image: string | null;
  price: Money;
  title: string;
  vendor: string | null;
}

export interface AgentOptionValue {
  image?: string;
  name: string;
  swatch?: OptionValueSwatch;
}

export interface AgentVariant {
  available: boolean;
  compareAtPrice: Money | null;
  id: string;
  options: { name: string; value: string }[];
  price: Money;
  requiresComponents: boolean;
  title: string;
}

export interface AgentProductDetails extends AgentProduct {
  description: string;
  images: string[];
  options: { name: string; values: AgentOptionValue[] }[];
  variants: AgentVariant[];
}
