import type { Metadata } from "next";

import { siteConfig } from "./config";

type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined;

const PAGINATION_CURSOR_PARAMS = ["cursor"];

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash === "/") return withLeadingSlash;
  return withLeadingSlash.replace(/\/+$/, "");
}

function toSearchParams(input: SearchParamsInput): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return new URLSearchParams(input);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (key.startsWith("filter.")) {
        if (value.length > 0) params.set(key, value.join(","));
      } else {
        for (const item of value) {
          params.append(key, item);
        }
      }
      continue;
    }
    params.set(key, value);
  }

  return params;
}

export function buildCanonicalPath(pathname: string, searchParams?: SearchParamsInput): string {
  const params = toSearchParams(searchParams);
  for (const key of PAGINATION_CURSOR_PARAMS) {
    params.delete(key);
  }

  const query = params.toString();
  const normalizedPath = normalizePath(pathname);
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

export function buildAlternates({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams?: SearchParamsInput;
}): Metadata["alternates"] {
  const canonical = buildCanonicalPath(pathname, searchParams);

  return {
    canonical,
  };
}

export function buildOpenGraph({
  title,
  description,
  url,
  type = "website",
  images = ["/og-default.png"],
}: {
  title: string;
  description?: string;
  url: string;
  type?: "website" | "article";
  images?: Array<
    | string
    | {
        url: string;
        width?: number;
        height?: number;
        alt?: string;
      }
  >;
}): Metadata["openGraph"] {
  return {
    type,
    title,
    description,
    url,
    siteName: siteConfig.name,
    images,
  };
}
