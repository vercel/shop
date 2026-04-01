import { stepCountIs, ToolLoopAgent, type ToolLoopAgentSettings } from "ai";

import { getSystemPrompt } from "./prompt";
import { createCommerceTools } from "./tools/commerce-tools";

const defaults: ToolLoopAgentSettings = {
  model: "anthropic/claude-sonnet-4.6",
};

export function createAgent() {
  const agent = new ToolLoopAgent({
    ...defaults,
    instructions: getSystemPrompt(),
    stopWhen: stepCountIs(10),
    tools: createCommerceTools(),
  });

  return agent;
}
