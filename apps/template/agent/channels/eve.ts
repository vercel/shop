import type { AuthFn } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import { defaultLocale } from "@/lib/i18n";

// httpOnly cart cookie; rides same-origin requests so the channel can read it here.
const CART_ID_COOKIE = "shopify_cartId";

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || undefined;
  }
  return undefined;
}

// Public assistant: every caller is an anonymous guest (parity with the old public /api/chat).
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
