import NextLink from "next/link";
import type { ComponentProps } from "react";

// Routes whose per-link runtime prefetch is worth paying for on intent: they read params/searchParams
// behind a Suspense boundary and their data is "use cache", so a hover/touch prefetch resolves the
// full page before the click. Everything else keeps the default shared App Shell prefetch.
const DYNAMIC_ON_HOVER_PREFIXES = ["/collections", "/products"];

export function shouldPrefetchOnHover(href: ComponentProps<typeof NextLink>["href"]): boolean {
  const pathname = typeof href === "string" ? href : href.pathname;
  if (!pathname) return false;
  return DYNAMIC_ON_HOVER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Drop-in for next/link. Product and collection URLs opt into unstable_dynamicOnHover automatically;
// pass `prefetch` or `unstable_dynamicOnHover` explicitly to override per link.
export function Link({ unstable_dynamicOnHover, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink
      {...props}
      unstable_dynamicOnHover={unstable_dynamicOnHover ?? shouldPrefetchOnHover(props.href)}
    />
  );
}

export default Link;
