import type { ToolContext } from "eve/tools";

import { signAgentValue } from "../../lib/agent/session/server";

export async function callCommerce(tool: string, input: unknown, ctx: ToolContext) {
  const shopperId = ctx.session.auth.current?.principalId;
  if (!shopperId) throw new Error("Open the storefront to use shopping tools.");
  const token = signAgentValue(
    JSON.stringify({
      callId: ctx.callId,
      expiresAt: Date.now() + 60_000,
      sessionId: ctx.session.id,
      shopperId,
      tool,
    }),
  );
  const headers = new Headers({
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  });
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET)
    headers.set("x-vercel-protection-bypass", process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  const response = await fetch(new URL("/api/agent/commerce", process.env.AGENT_STOREFRONT_URL), {
    body: JSON.stringify(input),
    headers,
    method: "POST",
    redirect: "error",
    // Cart requests settle independently of durable turn cancellation.
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(
      "Shopping tool could not be confirmed. Inspect the storefront before retrying a cart change.",
    );
  return response.json();
}
