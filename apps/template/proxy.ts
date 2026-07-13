import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isEnabledLocale, isLocale } from "@/lib/i18n";

// Hidden locale rewrite: every page request is internally served from the
// `[locale]` segment while the address bar stays clean. The market is chosen by
// the NEXT_LOCALE cookie (set by the nav market picker), falling back to the
// default locale.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (isLocale(first)) return NextResponse.next();

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const target = cookieLocale && isEnabledLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const url = new URL(`/${target}${pathname}`, request.url);
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!account/(?:authorize|login|logout|refresh)$|api|md|_next|_vercel|sitemap|robots.txt|llms.txt|.*\\..*).*)",
  ],
};
