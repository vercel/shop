import { createCartCookie } from "@shopify/hydrogen";
import { checkBotId } from "botid/server";

import { createCustomerRequestContext, createCustomerSessionManager } from "@/lib/auth/server";
import { createEmptyCart, getCartById, getCartIdFromCookie } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";

export async function POST(request: Request) {
  if (!shopConfig.agent.isEnabled) return new Response(null, { status: 404 });
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return new Response(null, { status: 403 });
  if (
    shopConfig.botid.isEnabled &&
    (await checkBotId({ advancedOptions: { checkLevel: shopConfig.botid.checkLevel } })).isBot
  )
    return new Response(null, { status: 403 });
  const requestContext = createCustomerRequestContext(request);
  const sessionManager = shopConfig.auth.isEnabled
    ? createCustomerSessionManager(request)
    : undefined;
  let response: Response;
  try {
    let cartId = await getCartIdFromCookie();
    if (!cartId || !(await getCartById(cartId)))
      cartId = await createEmptyCart(requestContext, sessionManager);
    response = Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    response.headers.append("Set-Cookie", createCartCookie(cartId));
  } catch {
    response = Response.json(
      { error: "Could not prepare your cart. Please try again." },
      { status: 503 },
    );
  }
  const sessionHeaders = await sessionManager?.commit?.();
  if (sessionHeaders)
    for (const cookie of new Headers(sessionHeaders).getSetCookie())
      response.headers.append("Set-Cookie", cookie);
  requestContext.applyResponseHeaders(response.headers);
  return response;
}
