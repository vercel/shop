import { pipeJsonRender } from "@json-render/core";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
} from "ai";
import { checkBotId } from "botid/server";
import { cookies } from "next/headers";

import { getRequestIp, rateLimit } from "@/lib/agent/rate-limit";
import { createAgent, type PageContext, type User, withAgentContext } from "@/lib/agent/server";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { createCartWithoutCookie } from "@/lib/shopify/operations/cart";
import { getCollection } from "@/lib/shopify/operations/collections";
import { getProduct } from "@/lib/shopify/operations/products";

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
    try {
      const handle = segments[1];
      const product = await getProduct(handle, locale);
      return { type: "product", product };
    } catch {
      // Product not found — fall through to other branches.
    }
  }

  if (pageType === "collections" && segments.length >= 2) {
    try {
      const handle = segments[1];
      const collection = await getCollection(handle, locale);
      if (collection) {
        return { type: "collection", handle, title: collection.title };
      }
    } catch {
      // Collection not found — fall through to other branches.
    }
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
  const bot = await checkBotId();
  if (bot.isBot) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = await rateLimit(getRequestIp(request.headers));
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await request.json();
  const store = await cookies();
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
  let cartId = store.get("shopify_cartId")?.value;
  let newCartCookie: string | undefined;

  if (!cartId) {
    const newCart = await createCartWithoutCookie(locale);
    cartId = newCart.id;
    const secure = process.env.NODE_ENV === "production";
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    newCartCookie = `shopify_cartId=${cartId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
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
