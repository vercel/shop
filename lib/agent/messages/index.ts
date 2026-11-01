import type { EveMessagePart, EveToolPart } from "eve/client";

const SETTLED_CALL_STATES = new Set(["cancelled", "completed", "failed", "rejected"]);

export function isToolPart(part: EveMessagePart): part is EveToolPart {
  return part.type === "tool";
}

export function isSettledToolPart(part: EveToolPart) {
  return SETTLED_CALL_STATES.has(part.state);
}

export function completedOutput(part: EveMessagePart) {
  if (!isToolPart(part) || part.state !== "completed") return undefined;
  const output = part.output;
  return output && typeof output === "object" && !Array.isArray(output) ? output : undefined;
}
