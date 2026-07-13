import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { cookies } from "next/headers";

const CART_ID_COOKIE = "shopify_cartId";
const CART_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
// Preview sits behind Vercel Authentication; its cross-site SSO return hop drops a SameSite=Strict cookie, so only prod gets Strict.
const CART_ID_COOKIE_SAME_SITE = process.env.VERCEL_ENV === "production" ? "strict" : "lax";

export async function getCartIdFromCookie(): Promise<string | undefined> {
  return (await cookies()).get(CART_ID_COOKIE)?.value;
}

export async function setCartIdCookie(id: string): Promise<void> {
  (await cookies()).set(CART_ID_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: CART_ID_COOKIE_SAME_SITE,
    maxAge: CART_ID_COOKIE_MAX_AGE,
    path: "/",
  });
}

/** Streaming contexts can't call cookies().set(); they must emit Set-Cookie via response headers. */
export function buildCartIdSetCookieHeader(id: string): string {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = CART_ID_COOKIE_SAME_SITE === "strict" ? "Strict" : "Lax";
  return `${CART_ID_COOKIE}=${id}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${CART_ID_COOKIE_MAX_AGE}${secure ? "; Secure" : ""}`;
}

export function invalidateCartCache(): void {
  try {
    updateTag("cart");
  } catch {
    // Fallback when used outside of server actions where updateTag is not available
    revalidateTag("cart", { expire: 0 });
  }
}
