export interface CatalogMoney {
  amount: number;
  currency: string;
}

export interface CatalogVariant {
  available: boolean | null;
  options: { label: string; name: string }[];
}

export interface CatalogProduct {
  collections: string[];
  handle: string;
  id: string;
  listPrice: CatalogMoney | null;
  options: { name: string; values: string[] }[];
  price: CatalogMoney | null;
  title: string;
  variants: CatalogVariant[];
}

export interface CatalogSearchResult {
  cursor: string | null;
  messages: string[];
  products: CatalogProduct[];
}
