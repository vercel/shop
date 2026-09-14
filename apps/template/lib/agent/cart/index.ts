import type { EveMessagePart } from "eve/client";

export function getCartMutationResult(part: EveMessagePart) {
  if (
    part.type !== "dynamic-tool" ||
    part.state !== "output-available" ||
    part.partial ||
    !isCartMutation(part.toolName)
  )
    return undefined;
  const output = part.output;
  if (
    !output ||
    typeof output !== "object" ||
    "error" in output ||
    !("cartUpdated" in output) ||
    output.cartUpdated !== true
  )
    return undefined;
  return {
    toolName: part.toolName,
    warnings:
      "warnings" in output && Array.isArray(output.warnings)
        ? output.warnings.filter((warning): warning is string => typeof warning === "string")
        : [],
  };
}

export function isCartMutation(tool: string) {
  return tool === "add-to-cart" || tool === "update-cart-item" || tool === "add-cart-note";
}
