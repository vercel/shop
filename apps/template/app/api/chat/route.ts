import { pipeJsonRender } from "@json-render/core";
import { createCartCookie } from "@shopify/hydrogen";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  toUIMessageStream,
} from "ai";
import { checkBotId } from "botid/server";

import { parsePageContext } from "@/lib/agent/routes";
import { createAgent } from "@/lib/agent/server";
import { createCustomerRequestContext, createCustomerSessionManager } from "@/lib/auth/server";
import { BOTID_DENIED_CODE, botIdCheckOptions } from "@/lib/botid";
import { createEmptyCart, getCartIdFromCookie } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";

export async function POST(request: Request) {
  if (!shopConfig.agent.isEnabled) return new Response(null, { status: 404 });

  // Runs before body parsing and cart creation so rejected traffic costs no Shopify or gateway work.
  if (shopConfig.botid.isEnabled) {
    const { isBot } = await checkBotId(botIdCheckOptions);
    if (isBot) return Response.json({ error: BOTID_DENIED_CODE }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("messages" in body) ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }
  const safeMessages = await safeValidateUIMessages({ messages: body.messages });
  if (!safeMessages.success) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const requestContext = createCustomerRequestContext(request);
  const sessionManager = shopConfig.auth.isEnabled
    ? createCustomerSessionManager(request)
    : undefined;
  let newCartCookie: string | undefined;
  let response: Response;

  try {
    // Page context comes from the same-origin Referer rather than client-supplied product data.
    const { page } = parsePageContext(request.headers.get("referer"));
    let cartId = await getCartIdFromCookie();
    if (!cartId) {
      cartId = await createEmptyCart(requestContext, sessionManager);
      newCartCookie = createCartCookie(cartId);
    }
    const agent = createAgent({ cartId, page });
    const result = await agent.stream({
      abortSignal: request.signal,
      messages: await convertToModelMessages(safeMessages.data, {
        ignoreIncompleteToolCalls: true,
        tools: agent.tools,
      }),
    });
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.merge(
          pipeJsonRender(
            toUIMessageStream({
              originalMessages: safeMessages.data,
              // pipeJsonRender only understands text deltas; reasoning parts would pass through unhandled.
              sendReasoning: false,
              stream: result.stream,
              tools: agent.tools,
            }),
          ),
        );
      },
    });

    response = createUIMessageStreamResponse({ stream });
  } catch {
    response = Response.json(
      { error: "Could not start the assistant. Please try again." },
      { status: 500 },
    );
  }

  // Preserve rotated session cookies even when cart creation or stream startup fails.
  const sessionHeaders = await sessionManager?.commit?.();
  if (sessionHeaders) {
    for (const cookie of new Headers(sessionHeaders).getSetCookie()) {
      response.headers.append("Set-Cookie", cookie);
    }
  }
  if (newCartCookie) response.headers.append("Set-Cookie", newCartCookie);
  requestContext.applyResponseHeaders(response.headers);
  return response;
}
