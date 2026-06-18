import { pipeJsonRender } from "@json-render/core";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
} from "ai";

import { createAgent, type PageContext, type User, withAgentContext } from "@/lib/agent/server";
import { buildCartIdSetCookieHeader, getCartIdFromCookie } from "@/lib/cart/server";
import { agent as agentConfig } from "@/lib/config";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { withFallback } from "@/lib/shopify/errors";
import { createCartWithoutCookie } from "@/lib/shopify/operations/cart";
import { getCollection } from "@/lib/shopify/operations/collections";
import { getProductWithVariants } from "@/lib/shopify/operations/products";

function parseReferer(referer: string | null): {
  locale: Locale;
  segments: string[];
} {
  if (!referer) {
    return { locale: defaultLocale, segments: [] };
  }

  try {
    const url = new URL(referer);
    const segments = url.pathname.split("/").filter(Boolean);

    return { locale: defaultLocale, segments };
  } catch {
    return { locale: defaultLocale, segments: [] };
  }
}

/** Fetches trusted data from the database — never trusts client-supplied context. */
async function resolvePageContext(
  segments: string[],
  locale: Locale,
  refererUrl: string | null,
): Promise<PageContext> {
  if (segments.length === 0) {
    return { type: "home" };
  }

  // segments[0] = page type, segments[1] = handle/id.
  const pageType = segments[0];

  if (pageType === "products" && segments.length >= 2) {
    const handle = segments[1];
    const product = await withFallback(getProductWithVariants({ handle, locale }), undefined);
    if (product) return { type: "product", product };
  }

  if (pageType === "collections" && segments.length >= 2) {
    const handle = segments[1];
    const collection = await withFallback(getCollection({ handle, locale }), undefined);
    if (collection) return { type: "collection", handle, title: collection.title };
  }

  if (pageType === "search") {
    try {
      const url = refererUrl ? new URL(refererUrl) : null;
      const query = url?.searchParams.get("q") || "";
      return { type: "search", query };
    } catch {
      return { type: "search", query: "" };
    }
  }

  if (pageType === "cart") {
    return { type: "cart" };
  }

  return null;
}

export async function POST(request: Request) {
  if (!agentConfig.enabled) {
    return new Response(null, { status: 404 });
  }

  const body = await request.json();
  const { messages, chatId } = body;

  if (!chatId) {
    return Response.json({ error: "Chat ID is required" }, { status: 400 });
  }

  const safeMessages = await safeValidateUIMessages({ messages });
  if (!safeMessages.success) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const modelMessages = await convertToModelMessages(safeMessages.data);

  // Resolve context from Referer header (server-side, not client-sent)
  const referer = request.headers.get("referer");
  const { locale, segments } = parseReferer(referer);
  const user: User = { type: "guest", locale };
  const page = await resolvePageContext(segments, locale, referer);

  // Get or create cart before streaming (cookies can't be set during stream)
  let cartId = await getCartIdFromCookie();
  let newCartCookie: string | undefined;

  if (!cartId) {
    const { cart: newCart } = await createCartWithoutCookie(locale);
    if (newCart.id) {
      cartId = newCart.id;
      newCartCookie = buildCartIdSetCookieHeader(newCart.id);
    }
  }

  return withAgentContext(
    {
      chatId,
      user,
      cart: cartId,
      page,
    },
    async () => {
      const agent = createAgent();

      const result = await agent.stream({
        messages: modelMessages,
      });

      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          writer.merge(pipeJsonRender(result.toUIMessageStream()));
        },
      });

      return createUIMessageStreamResponse({
        stream,
        headers: newCartCookie ? { "Set-Cookie": newCartCookie } : undefined,
      });
    },
  );
}
