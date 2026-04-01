import { handleMcpRequest } from "@/lib/mcp/server";

/**
 * MCP (Model Context Protocol) endpoint using Streamable HTTP transport.
 *
 * Implements JSON-RPC 2.0 over POST. Supports:
 * - initialize: handshake with protocol version and capabilities
 * - tools/list: enumerate available commerce tools
 * - tools/call: execute a commerce tool
 *
 * All tools operate through the CommerceProvider abstraction,
 * sharing the same cache as the storefront UI.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: invalid JSON" },
      },
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const response = await handleMcpRequest(body);

  return Response.json(response, {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET handler returns server metadata for MCP discovery.
 */
export async function GET(): Promise<Response> {
  return Response.json({
    name: "commerce-mcp",
    version: "1.0.0",
    protocol: "mcp",
    transport: "streamable-http",
    endpoint: "/api/mcp",
    capabilities: {
      tools: { listChanged: false },
    },
  });
}
