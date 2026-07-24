import { NextResponse } from "next/server";

export function proxy(): NextResponse {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
    "/.well-known/:path*",
  ],
};
