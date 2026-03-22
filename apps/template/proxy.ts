export const config = {
  matcher: [
    "/((?!.well-known|api|sitemaps|webhooks|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

import { NextResponse } from "next/server";

export default async function middleware() {
  return NextResponse.next();
}
