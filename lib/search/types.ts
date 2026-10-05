import type { Image } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";

export interface PredictiveSearchProduct {
  featuredImage: Image | null;
  handle: string;
  id: string;
  price: Money;
  title: string;
}

export interface SearchSuggestion {
  styledText: string;
  text: string;
}

export interface PredictiveSearchResult {
  products: PredictiveSearchProduct[];
  queries: SearchSuggestion[];
}
