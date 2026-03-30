import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

const MDX_EXTENSION_PATTERN = /\.mdx?$/;

const proxy = (request: NextRequest, _context: NextFetchEvent) => {
  const pathname = request.nextUrl.pathname;

  // Handle .md/.mdx URL requests — rewrite to /llms.mdx/ routes
  if (
    (pathname === "/docs.md" ||
      pathname === "/docs.mdx" ||
      pathname.startsWith("/docs/")) &&
    (pathname.endsWith(".md") || pathname.endsWith(".mdx"))
  ) {
    const stripped = pathname.replace(MDX_EXTENSION_PATTERN, "");
    const slug = stripped === "/docs" ? "" : stripped.replace(/^\/docs\//, "");
    const target = slug ? `/llms.mdx/${slug}` : "/llms.mdx";
    return NextResponse.rewrite(new URL(target, request.nextUrl));
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export default proxy;
