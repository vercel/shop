export function getMarkdownPath(pathname: string): string | null {
  if (pathname === "/") return "/md";
  if (pathname === "/search") return "/md/search";
  if (pathname.startsWith("/collections/")) return `/md${pathname}`;
  if (pathname.startsWith("/products/")) return `/md${pathname}`;
  return null;
}
