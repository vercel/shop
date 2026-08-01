import { createShopifyRequestContext, type I18nConfig } from "@shopify/hydrogen";
import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

import { BOTID_DENIED_CODE, botIdCheckOptions } from "@/lib/botid";
import { cartHandlers } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront";

function storefrontClient(request: Request) {
  const requestContext = createShopifyRequestContext({
    i18n: {
      country: getCountryCode(defaultLocale),
      language: getLanguageCode(defaultLocale),
    } as I18nConfig,
    request,
  });
  return createRequestStorefrontClient(requestContext);
}

type CartRouteResult =
  | { data: unknown; headers?: HeadersInit; type: "json" }
  | { error: { code: string; message: string }; type: "error" }
  | { headers?: HeadersInit; location: string; type: "redirect" };

function toResponse(result: CartRouteResult, request: Request): NextResponse {
  if (result.type === "redirect") {
    const location = new URL(result.location, new URL(request.url).origin);
    return NextResponse.redirect(location, { headers: result.headers, status: 303 });
  }
  if (result.type === "error") {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data, { headers: result.headers });
}

export async function GET(request: Request) {
  const result = await cartHandlers.get({ request, storefrontClient: storefrontClient(request) });
  return toResponse(result as CartRouteResult, request);
}

export async function POST(request: Request) {
  // Runs before the cart handler so rejected traffic costs no Shopify work.
  if (shopConfig.botid.isEnabled) {
    const { isBot } = await checkBotId(botIdCheckOptions);
    if (isBot) return NextResponse.json({ error: BOTID_DENIED_CODE }, { status: 403 });
  }
  const result = await cartHandlers.post({ request, storefrontClient: storefrontClient(request) });
  return toResponse(result as CartRouteResult, request);
}
