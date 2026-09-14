import { agentProfile } from "@/agent/lib/profile";
import { shopConfig } from "@/lib/config";

export function GET() {
  if (!shopConfig.agent.isEnabled) return new Response(null, { status: 404 });
  return Response.json(agentProfile, { headers: { "Cache-Control": "public, max-age=300" } });
}
