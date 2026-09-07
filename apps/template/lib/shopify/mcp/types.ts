export interface McpMoney {
  amount: number;
  currency: string;
}

export interface McpCatalogProduct {
  categories?: Array<{ name?: string }>;
  description?: { html?: string };
  id: string;
  media?: Array<{ alt_text?: string; url?: string }>;
  price_range?: { max?: McpMoney; min?: McpMoney };
  tags?: string[];
  title: string;
  variants?: Array<{
    availability?: { available?: boolean };
    id: string;
    media?: Array<{ url?: string }>;
    price?: McpMoney;
    title?: string;
  }>;
}

export interface McpCatalogSearchResult {
  instructions?: string;
  pagination?: { cursor?: string; has_next_page?: boolean };
  products?: McpCatalogProduct[];
}
export interface McpPolicyAnswer {
  answer?: string;
  question?: string;
  sources?: Array<{ title?: string; url?: string }>;
}
