import type { AuthFn } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import { defaultLocale } from "@/lib/i18n";

// The storefront cart cookie (httpOnly). It rides same-origin requests into the
// channel, so the eve runtime can read the caller's cart id here and expose it
// (plus the deployment locale) to tools via ctx.session.auth.current.attributes.
const CART_ID_COOKIE = "shopify_cartId";

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || undefined;
  }
  return undefined;
}

// Public shopping assistant: every caller is an anonymous guest (parity with the
// former public /api/chat route). The cart cookie scopes cart tools per browser.
function guestSession(): AuthFn<Request> {
  return (request) => {
    const cartId = readCookie(request.headers.get("cookie"), CART_ID_COOKIE);
    return {
      authenticator: "guest",
      principalId: "guest",
      principalType: "anonymous",
      attributes: { locale: defaultLocale, ...(cartId ? { cartId } : {}) },
    };
  };
}

export default eveChannel({ auth: [guestSession()] });
