import { checkBotId } from "botid/server";
import { defineChannel, type HttpRouteDefinition } from "eve/channels";
import { type AuthFn, ForbiddenError } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import {
  agentKey,
  agentStore,
  assertSessionOwner,
  getShopperSession,
  isSameOrigin,
  SESSION_TTL,
} from "../../lib/agent/session/server";
import { shopConfig } from "../../lib/config";

const authenticate: AuthFn<Request> = async (request) => {
  if (!shopConfig.agent.isEnabled) return null;
  if (request.method !== "GET" && !isSameOrigin(request)) throw new ForbiddenError();
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new ForbiddenError();
  const shopper = await getShopperSession(request);
  if (!shopper) return null;
  const sessionId = new URL(request.url).pathname.match(/\/eve\/v1\/session\/([^/]+)/)?.[1];
  if (sessionId) {
    try {
      await assertSessionOwner(decodeURIComponent(sessionId), shopper.id);
    } catch {
      throw new ForbiddenError();
    }
  }
  if (
    shopConfig.botid.isEnabled &&
    (
      await checkBotId({
        advancedOptions: {
          checkLevel: shopConfig.botid.checkLevel,
          headers: Object.fromEntries(request.headers.entries()),
        },
      })
    ).isBot
  )
    throw new ForbiddenError();
  if (
    request.method === "POST" &&
    !/\/(cancel|reset|clear|compact)$/.test(new URL(request.url).pathname)
  ) {
    const key = agentKey("rate", `${shopper.id}:${Math.floor(Date.now() / 60_000)}`);
    const count = await agentStore().incr(key);
    await agentStore().expire(key, 120);
    if (count > 20)
      throw new ForbiddenError({ message: "Too many messages. Please wait a minute." });
  }
  return { attributes: {}, authenticator: "shop", principalId: shopper.id, principalType: "user" };
};

const channel = eveChannel({ auth: authenticate, turnPolicy: "queue", uploadPolicy: "disabled" });

export default defineChannel({
  turnPolicy: "queue",
  routes: channel.routes.map((route) => {
    if (route.method === "WEBSOCKET") return route;
    const original = route as HttpRouteDefinition;
    return {
      ...original,
      async handler(request, context) {
        if (!shopConfig.agent.isEnabled || original.path === "/eve/v1/info")
          return new Response(null, { status: 404 });
        const response = await original.handler(request, context);
        if (response.ok && original.method === "POST" && original.path === "/eve/v1/session") {
          const body: unknown = await response.clone().json();
          const shopper = await getShopperSession(request);
          if (
            shopper &&
            body &&
            typeof body === "object" &&
            "sessionId" in body &&
            typeof body.sessionId === "string"
          ) {
            await agentStore().set(
              agentKey("session", body.sessionId),
              { cartId: shopper.cartId, shopperId: shopper.id },
              {
                ex: SESSION_TTL,
                nx: true,
              },
            );
          }
        }
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      },
    } satisfies HttpRouteDefinition;
  }),
});
