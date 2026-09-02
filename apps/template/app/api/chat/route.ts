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
import { createAgent, type User, withAgentContext } from "@/lib/agent/server";
import { BOTID_DENIED_CODE, botIdCheckOptions } from "@/lib/botid";
import { getCartIdFromCookie } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { createCart } from "@/lib/shopify/operations/cart";

export async function POST(request: Request) {
  if (!shopConfig.agent.isEnabled) return new Response(null, { status: 404 });

  // Runs before body parsing and cart creation so rejected traffic costs no Shopify or gateway work.
  if (shopConfig.botid.isEnabled) {
    const { isBot } = await checkBotId(botIdCheckOptions);
    if (isBot) return Response.json({ error: BOTID_DENIED_CODE }, { status: 403 });
  }

  let body: { messages?: unknown };
  try {
    body = (await request.json()) as { messages?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const safeMessages = await safeValidateUIMessages({ messages: body.messages });
  if (!safeMessages.success) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  // Page context comes from the same-origin Referer rather than client-supplied product data.
  const { locale, page } = parsePageContext(request.headers.get("referer"));
  const user: User = { locale, type: "guest" };

  let cartId = await getCartIdFromCookie();
  let newCartCookie: string | undefined;
  if (!cartId) {
    const { cart } = await createCart(locale);
    if (cart.id) {
      cartId = cart.id;
      newCartCookie = createCartCookie(cart.id);
    }
  }

  return withAgentContext({ cart: cartId, page, user }, async () => {
    const agent = createAgent();
    const result = await agent.stream({
      messages: await convertToModelMessages(safeMessages.data),
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

    return createUIMessageStreamResponse({
      headers: newCartCookie ? { "Set-Cookie": newCartCookie } : undefined,
      stream,
    });
  });
}
