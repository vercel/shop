import { type McpToolDefinition, mcpTools } from "./tools";

const MCP_PROTOCOL_VERSION = "2025-03-26";

const SERVER_INFO = {
  name: "commerce-mcp",
  version: "1.0.0",
};

const SERVER_CAPABILITIES = {
  tools: { listChanged: false },
};

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function jsonRpcResult(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

const toolMap = new Map<string, McpToolDefinition>();
for (const t of mcpTools) {
  toolMap.set(t.name, t);
}

function handleInitialize(id: string | number | null): JsonRpcResponse {
  return jsonRpcResult(id, {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: SERVER_CAPABILITIES,
    serverInfo: SERVER_INFO,
  });
}

function handleToolsList(id: string | number | null): JsonRpcResponse {
  return jsonRpcResult(id, {
    tools: mcpTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  });
}

async function handleToolsCall(
  id: string | number | null,
  params: Record<string, unknown>,
): Promise<JsonRpcResponse> {
  const toolName = params.name as string;
  const args = (params.arguments as Record<string, unknown>) ?? {};

  const toolDef = toolMap.get(toolName);
  if (!toolDef) {
    return jsonRpcError(id, -32602, `Unknown tool: ${toolName}`);
  }

  try {
    const result = await toolDef.execute(args);
    return jsonRpcResult(id, {
      content: [{ type: "text", text: JSON.stringify(result) }],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed";
    return jsonRpcResult(id, {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    });
  }
}

export async function handleMcpRequest(body: unknown): Promise<JsonRpcResponse> {
  const req = body as JsonRpcRequest;

  if (!req || req.jsonrpc !== "2.0" || !req.method) {
    return jsonRpcError(req?.id ?? null, -32600, "Invalid JSON-RPC request");
  }

  const { id, method, params } = req;
  const rpcId = id ?? null;

  switch (method) {
    case "initialize":
      return handleInitialize(rpcId);

    case "notifications/initialized":
      // Client acknowledgment — no response needed, but return result for safety
      return jsonRpcResult(rpcId, {});

    case "tools/list":
      return handleToolsList(rpcId);

    case "tools/call":
      if (!params?.name) {
        return jsonRpcError(rpcId, -32602, "Missing tool name in params");
      }
      return handleToolsCall(rpcId, params);

    default:
      return jsonRpcError(rpcId, -32601, `Method not found: ${method}`);
  }
}
