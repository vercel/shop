export const config = {
  matcher: [
    "/((?!.well-known|api|sitemaps|webhooks|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

import { type NextRequest, NextResponse } from "next/server";

import { defaultLocale } from "@/lib/i18n";

/**
 * Parse Accept header according to RFC 7231.
 * Returns true if the header indicates acceptance of text/markdown.
 * Properly handles quality factors (q-values) and wildcard matches.
 */
function acceptsMarkdown(acceptHeader: string): boolean {
  if (!acceptHeader) return false;

  // Split by comma to get media-ranges
  const mediaRanges = acceptHeader.split(",");

  for (const range of mediaRanges) {
    const parts = range.trim().split(";");
    const mediaType = parts[0].trim().toLowerCase();

    // Parse quality factor (default 1.0 if not specified)
    let quality = 1.0;
    for (let i = 1; i < parts.length; i++) {
      const param = parts[i].trim();
      if (param.startsWith("q=")) {
        quality = parseFloat(param.substring(2));
        break;
      }
    }

    // Skip if quality is 0 or less (explicitly rejected)
    if (quality <= 0) continue;

    // Only match explicit text/markdown requests
    if (mediaType === "text/markdown") {
      return true;
    }
  }

  return false;
}

export default async function middleware(request: NextRequest) {
  const acceptHeader = request.headers.get("accept") || "";

  if (acceptsMarkdown(acceptHeader)) {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length >= 2 && segments[0] === "products") {
      const handle = segments[1];
      const rewriteUrl = new URL(`/api/md/products/${handle}?locale=${defaultLocale}`, request.url);
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return NextResponse.next();
}
