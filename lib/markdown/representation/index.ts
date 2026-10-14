import { shopConfig } from "@/lib/config";

import type { AcceptEntry, Representation } from "./types";

const REPRESENTATIONS = ["text/html", "text/markdown"] as const;

function matches(entry: AcceptEntry, representation: Representation): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) return representation.startsWith(entry.type.slice(0, -1));
  return entry.type === representation;
}

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((value, position) => {
      const [type = "", ...parameters] = value
        .trim()
        .split(";")
        .map((part) => part.trim());
      let quality = 1;

      for (const parameter of parameters) {
        const [name, rawValue] = parameter.split("=").map((part) => part.trim());
        if (name?.toLowerCase() !== "q") continue;

        const parsed = Number(rawValue);
        quality = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0;
      }

      const normalizedType = type.toLowerCase();
      const specificity = normalizedType === "*/*" ? 0 : normalizedType.endsWith("/*") ? 1 : 2;

      return { position, quality, specificity, type: normalizedType };
    })
    .filter(({ type }) => type.includes("/"));
}

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;

  const entries = parseAccept(accept);
  if (entries.length === 0) return false;

  let selection: { position: number; quality: number; representation: Representation } | null =
    null;

  for (const representation of REPRESENTATIONS) {
    let match: AcceptEntry | null = null;

    for (const entry of entries) {
      if (!matches(entry, representation)) continue;
      if (
        !match ||
        entry.specificity > match.specificity ||
        (entry.specificity === match.specificity && entry.position < match.position)
      ) {
        match = entry;
      }
    }

    if (!match || match.quality === 0) continue;
    if (
      !selection ||
      match.quality > selection.quality ||
      (match.quality === selection.quality && match.position < selection.position)
    ) {
      selection = {
        position: match.position,
        quality: match.quality,
        representation,
      };
    }
  }

  return selection?.representation === "text/markdown";
}

function appendVaryAccept(headers: Headers): void {
  const vary = headers.get("Vary");
  if (!vary) {
    headers.set("Vary", "Accept");
    return;
  }

  const values = vary.split(",").map((value) => value.trim().toLowerCase());
  if (!values.includes("accept")) headers.set("Vary", `${vary}, Accept`);
}

export function getMarkdownPath(pathname: string): string | null {
  if (pathname === "/") return "/md";
  if (pathname === "/search") return "/md/search";
  if (pathname.startsWith("/collections/")) return `/md${pathname}`;
  if (pathname.startsWith("/products/")) return `/md${pathname}`;
  return null;
}

export function getMarkdownMirrorPath(pathname: string): string | null {
  if (!pathname.endsWith(".md")) return null;
  const pagePath = pathname.slice(0, -".md".length);
  return getMarkdownPath(pagePath === "/index" ? "/" : pagePath);
}

export function getMarkdownRewritePath(request: Request): string | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const { pathname } = new URL(request.url);
  return (
    getMarkdownMirrorPath(pathname) ??
    (prefersMarkdown(request.headers.get("Accept")) ? getMarkdownPath(pathname) : null)
  );
}

export function markdownHeaders({
  cacheControl,
  pathname,
}: {
  cacheControl: string;
  pathname: string;
}): Headers {
  const headers = new Headers({
    "Cache-Control": cacheControl,
    "Content-Type": "text/markdown; charset=utf-8",
    Link: `<${new URL(pathname, shopConfig.site.url)}>; rel="canonical"`,
    "X-Robots-Tag": "noindex",
  });
  appendVaryAccept(headers);
  return headers;
}
