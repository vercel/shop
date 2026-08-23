import { shopConfig } from "@/lib/config";

import { appendVaryAccept } from "./negotiation";

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
