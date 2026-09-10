import { createCartCookie } from "@shopify/hydrogen";
import { checkBotId } from "botid/server";

import {
  getShopperSession,
  isSameOrigin,
  saveShopperSession,
  shopperCookie,
} from "@/lib/agent/session/server";
import { createCustomerRequestContext, createCustomerSessionManager } from "@/lib/auth/server";
import { createEmptyCart, getCartById, getCartIdFromCookie } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";

export async function POST(request: Request) {
  if (!shopConfig.agent.isEnabled) return new Response(null, { status: 404 });
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
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
    const previous = await getShopperSession(request);
    if (!cartId || !previous || previous.cartId !== cartId) {
      if (!cartId || !(await getCartById(cartId)))
        cartId = await createEmptyCart(requestContext, sessionManager);
    }
    const session = await saveShopperSession(request, cartId);
    response = Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    response.headers.append("Set-Cookie", createCartCookie(cartId));
    response.headers.append(
      "Set-Cookie",
      shopperCookie(session.id, new URL(process.env.AGENT_STOREFRONT_URL!).protocol === "https:"),
    );
  } catch {
    response = Response.json(
      { error: "Could not prepare the assistant. Please try again." },
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
