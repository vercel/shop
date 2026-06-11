import { createProxy } from "@vercel/geistdocs/proxy";
import { NextResponse } from "next/server";

import { config as geistdocsConfig } from "@/lib/geistdocs/config";
import { trackMdRequest } from "@/lib/geistdocs/md-tracking";

// Static assets served from public/ (homepage images, fonts, media). These
// must bypass the i18n rewrite, which would otherwise send them to
// /en/<asset> and 404. OG images are excluded from the bypass because they
// are app routes under /[lang]/og/ that rely on the locale rewrite.
const STATIC_ASSET_PATTERN = /\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|mp4|webm)$/i;
const OG_ROUTE_PATTERN = /^\/(?:[\w-]+\/)?og\//;

const proxy = createProxy({
  config: geistdocsConfig,
  trackMarkdownRequest: trackMdRequest,
  before: ({ request }) => {
    const { pathname } = request.nextUrl;
    if (STATIC_ASSET_PATTERN.test(pathname) && !OG_ROUTE_PATTERN.test(pathname)) {
      return NextResponse.next();
    }
    return null;
  },
});

export const config = {
  matcher: ["/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};

export default proxy;
