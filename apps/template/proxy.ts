import { NextResponse } from "next/server";

export function proxy(): NextResponse {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|_vercel/|apple-icon(?:/|$)|browserconfig\\.xml|favicon\\.ico|icon(?:/|$)|llms\\.txt|manifest\\.(?:json|webmanifest)|opengraph-image(?:/|$)|robots\\.txt|site\\.webmanifest|sitemap\\.xml|sitemap/|twitter-image(?:/|$)|.*\\.(?:7z|avif|bmp|bz2|css|csv|doc|docx|eot|epub|gif|gz|heic|heif|htm|html|ico|jpeg|jpg|js|json|map|md|mjs|mp3|mp4|mpeg|ogg|otf|pdf|png|ppt|pptx|rar|rss|svg|tar|tif|tiff|tsv|ttf|txt|wasm|wav|webm|webmanifest|webp|woff|woff2|xls|xlsx|xml|zip)$).*)",
    "/api/:path*",
    "/.well-known/:path*",
  ],
};
