import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "@/lib/i18n/routing";

const handlei18n = createMiddleware(routing);

export default function middleware(request: NextRequest): NextResponse {
  const response = handlei18n(request);
  if (!response.ok) return response;

  const rewriteHeader = response.headers.get("x-middleware-rewrite");
  if (!rewriteHeader) return response;

  const rewriteTarget = new URL(rewriteHeader, request.url);
  const [, ...segments] = rewriteTarget.pathname.split("/");
  const normalized = new URL(`/${segments.filter(Boolean).join("/")}`, request.url);
  normalized.search = rewriteTarget.search;

  return NextResponse.rewrite(normalized, { headers: response.headers });
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
