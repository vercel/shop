import type { EveMessagePart } from "eve/client";

import { completedOutput } from "../messages";
import { AGENT_TOOL } from "../tools";

export function getCartMutationResult(part: EveMessagePart) {
  const output = completedOutput(part);
  if (
    !output ||
    part.type !== "tool" ||
    !isCartMutation(part.name) ||
    "error" in output ||
    !("cartUpdated" in output) ||
    output.cartUpdated !== true
  )
    return undefined;
  return {
    toolName: part.name,
    warnings:
      "warnings" in output && Array.isArray(output.warnings)
        ? output.warnings.filter((warning): warning is string => typeof warning === "string")
        : [],
  };
}

export function isCartMutation(tool: string) {
  return tool === AGENT_TOOL.updateCart;
}
