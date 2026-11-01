import { z } from "zod";

import { logShopifyDebug } from "@/lib/shopify/logging/server";

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN as string;

const REQUEST_TIMEOUT_MS = 10_000;

const rpcResponseSchema = z.object({
  error: z.object({ message: z.string() }).optional(),
  result: z
    .object({
      content: z.array(z.object({ text: z.string().optional(), type: z.string() })).optional(),
      isError: z.boolean().optional(),
      structuredContent: z.unknown().optional(),
    })
    .optional(),
});

function rpcPayload(body: string, contentType: string | null) {
  if (!contentType?.includes("text/event-stream")) return body;
  const data = body
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .at(-1);
  return data?.slice("data:".length) ?? "null";
}

export async function callShopifyMcpTool({
  args,
  name,
  path,
}: {
  args: Record<string, unknown>;
  name: string;
  path: "/api/mcp" | "/api/ucp/mcp";
}) {
  const start = performance.now();
  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}${path}`, {
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "tools/call",
        params: { arguments: args, name },
      }),
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`${name} returned ${response.status}`);
    const rpc = rpcResponseSchema.parse(
      JSON.parse(rpcPayload(await response.text(), response.headers.get("content-type"))),
    );
    if (rpc.error || !rpc.result || rpc.result.isError)
      throw new Error(rpc.error?.message ?? `${name} failed`);
    return rpc.result;
  } finally {
    logShopifyDebug("Shopify MCP request", {
      durationMs: Math.round(performance.now() - start),
      operation: name,
      scope: "mcp",
    });
  }
}
