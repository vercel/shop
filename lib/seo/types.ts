export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined;

export interface SEO {
  description: string;
  title: string;
}
