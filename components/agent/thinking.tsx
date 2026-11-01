"use client";

import { AGENT_TOOL } from "@/lib/agent/tools";

export function AgentThinking({ active, tool }: { active: boolean; tool?: string }) {
  if (!active) return null;
  const toolLabels: Record<string, string> = {
    [AGENT_TOOL.browseCollections]: "Browsing collections…",
    [AGENT_TOOL.getCart]: "Checking your cart…",
    [AGENT_TOOL.getProductDetails]: "Looking up product details…",
    [AGENT_TOOL.getRecommendations]: "Finding recommendations…",
    [AGENT_TOOL.navigate]: "Finding the page…",
    [AGENT_TOOL.presentProducts]: "Preparing product cards…",
    [AGENT_TOOL.searchPolicies]: "Checking store policies…",
    [AGENT_TOOL.searchProducts]: "Searching products…",
    [AGENT_TOOL.updateCart]: "Updating your cart…",
  };

  return (
    <p className="shimmer w-fit text-muted-foreground text-sm" role="status">
      {tool && Object.hasOwn(toolLabels, tool) ? toolLabels[tool] : "Thinking…"}
    </p>
  );
}
