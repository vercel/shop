import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const variantId = searchParams.get("variantId");

  if (variantId && pathname.match(/^\/products\/[^/]+$/)) {
    const url = request.nextUrl.clone();
    url.pathname = `${pathname}/${variantId}`;
    url.searchParams.delete("variantId");
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: "/products/:path*",
};
