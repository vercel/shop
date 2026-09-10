import { z } from "zod";

import { commerceSchemas, isCartMutation } from "@/lib/agent/commerce";
import { executeCommerce } from "@/lib/agent/commerce/server";
import {
  agentKey,
  agentStore,
  assertSessionOwner,
  SESSION_TTL,
  verifyAgentValue,
} from "@/lib/agent/session/server";
import type { AgentSessionBinding, ShopperSession } from "@/lib/agent/session/types";
import { shopConfig } from "@/lib/config";

export const maxDuration = 60;

const claimsSchema = z.strictObject({
  callId: z.string().min(1).max(200),
  expiresAt: z.number(),
  sessionId: z.string().min(1).max(200),
  shopperId: z.string().uuid(),
  tool: z.enum(
    Object.keys(commerceSchemas) as [
      keyof typeof commerceSchemas,
      ...(keyof typeof commerceSchemas)[],
    ],
  ),
});
const unconfirmed = {
  error:
    "The cart update could not be confirmed. Inspect the cart before requesting another change; it may already have succeeded.",
};

export async function POST(request: Request) {
  if (!shopConfig.agent.isEnabled) return new Response(null, { status: 404 });
  let claims: z.infer<typeof claimsSchema>;
  let input: unknown;
  let binding: AgentSessionBinding;
  try {
    const value = verifyAgentValue(
      request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "",
    );
    claims = claimsSchema.parse(JSON.parse(value ?? "null"));
    if (claims.expiresAt < Date.now() || claims.expiresAt > Date.now() + 120_000)
      throw new Error("Expired request");
    binding = await assertSessionOwner(claims.sessionId, claims.shopperId);
    if (Number(request.headers.get("content-length") ?? 0) > 16_384)
      return new Response(null, { status: 413 });
    const text = await request.text();
    if (text.length > 16_384) return new Response(null, { status: 413 });
    input = commerceSchemas[claims.tool].parse(JSON.parse(text));
  } catch {
    return new Response(null, { status: 403 });
  }
  const store = agentStore();
  const shopper = await store.get<ShopperSession>(agentKey("shopper", claims.shopperId));
  if (!shopper || shopper.expiresAt < Date.now()) return new Response(null, { status: 401 });
  if (shopper.cartId !== binding.cartId)
    return Response.json(
      { error: "Your active cart changed. Clear the conversation before continuing." },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  const headers = { "Cache-Control": "private, no-store" };
  const mutation = isCartMutation(claims.tool);
  const operationKey = agentKey("operation", `${claims.sessionId}:${claims.callId}`);
  const lockKey = agentKey("cart-lock", shopper.cartId);
  if (mutation) {
    const previous = await store.get<{ result?: unknown }>(operationKey);
    if (previous) return Response.json(previous.result ?? unconfirmed, { headers });
    if (!(await store.set(lockKey, { operationKey }, { ex: 120, nx: true })))
      return Response.json(
        { error: "A cart change is pending or unconfirmed. Inspect the cart before trying again." },
        { headers },
      );
    if (!(await store.set(operationKey, { started: true }, { ex: SESSION_TTL * 2, nx: true })))
      return Response.json(unconfirmed, { headers });
  }
  try {
    const result = await executeCommerce(claims.tool, input, shopper.cartId);
    if (mutation) {
      await store.set(operationKey, { result }, { ex: SESSION_TTL * 2 });
      await store.eval(
        "local value = redis.call('get', KEYS[1]); if value and cjson.decode(value).operationKey == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        [lockKey],
        [operationKey],
      );
    }
    return Response.json(result, { headers });
  } catch {
    // An interrupted write must remain claimed so durable replay cannot submit it twice.
    return Response.json(
      mutation ? unconfirmed : { error: "This shopping service is unavailable. Please try again." },
      { headers },
    );
  }
}
