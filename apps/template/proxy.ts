import { NextResponse } from "next/server";

export function proxy(): NextResponse {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|_vercel/|.*\\..*).*)", "/.well-known/:path*"],
};
