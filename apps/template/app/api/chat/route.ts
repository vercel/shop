import { pipeJsonRender } from "@json-render/core";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  toUIMessageStream,
} from "ai";

import { createAgent, type PageContext, type User, withAgentContext } from "@/lib/agent/server";
import { buildCartIdSetCookieHeader, getCartIdFromCookie } from "@/lib/cart/server";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { withFallback } from "@/lib/shopify/errors";
import { createCartWithoutCookie } from "@/lib/shopify/operations/cart";
import { getCollection } from "@/lib/shopify/operations/collections";
import { getProductWithVariants } from "@/lib/shopify/operations/products";
import { shopConfig } from "@/shop.config";

function parseReferer(referer: string | null): { locale: Locale; segments: string[] } {
  if (!referer) return { locale: defaultLocale, segments: [] };
  try {
    const url = new URL(referer);
    return { locale: defaultLocale, segments: url.pathname.split("/").filter(Boolean) };
  } catch {
    return { locale: defaultLocale, segments: [] };
  }
}

async function resolvePageContext(
  segments: string[],
  locale: Locale,
  referer: string | null,
): Promise<PageContext> {
  if (segments.length === 0) return { type: "home" };
  const [pageType, handle] = segments;

  if (pageType === "products" && handle) {
    const product = await withFallback(getProductWithVariants({ handle, locale }), undefined);
    if (product) return { product, type: "product" };
  }
  if (pageType === "collections" && handle) {
    const collection = await withFallback(getCollection({ handle, locale }), undefined);
    if (collection) return { handle, title: collection.title, type: "collection" };
  }
  if (pageType === "search") {
    try {
      return { query: referer ? new URL(referer).searchParams.get("q") || "" : "", type: "search" };
    } catch {
      return { query: "", type: "search" };
    }
  }
  if (pageType === "cart") return { type: "cart" };
  return null;
}

export async function POST(request: Request) {
  if (!shopConfig.agent.enabled) return new Response(null, { status: 404 });

  let body: { id?: unknown; messages?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; messages?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.id !== "string" || !body.id) {
    return Response.json({ error: "Chat ID is required" }, { status: 400 });
  }
  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const safeMessages = await safeValidateUIMessages({ messages: body.messages });
  if (!safeMessages.success) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const referer = request.headers.get("referer");
  const { locale, segments } = parseReferer(referer);
  const page = await resolvePageContext(segments, locale, referer);
  const user: User = { locale, type: "guest" };

  let cartId = await getCartIdFromCookie();
  let newCartCookie: string | undefined;
  if (!cartId) {
    const { cart } = await createCartWithoutCookie(locale);
    if (cart.id) {
      cartId = cart.id;
      newCartCookie = buildCartIdSetCookieHeader(cart.id);
    }
  }

  return withAgentContext({ cart: cartId, chatId: body.id, page, user }, async () => {
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
