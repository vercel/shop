import { compileSpecStream, type Spec } from "@json-render/core";

// Client-side stand-in for the server-side pipeJsonRender (eve owns the model loop).
const SPEC_FENCE = /```spec\s*\n([\s\S]*?)(?:\n```|$)/;

export interface EveJsonRenderResult {
  readonly hasSpec: boolean;
  readonly spec: Spec | null;
  readonly text: string;
}

export function extractSpecFromText(fullText: string): EveJsonRenderResult {
  const match = fullText.match(SPEC_FENCE);
  if (!match || match.index === undefined) {
    return { hasSpec: false, spec: null, text: fullText.trim() };
  }

  const prose = (
    fullText.slice(0, match.index) + fullText.slice(match.index + match[0].length)
  ).trim();

  let spec: Spec;
  try {
    spec = compileSpecStream(match[1], {
      root: "",
      elements: {},
    } as Record<string, unknown>) as unknown as Spec;
  } catch {
    return { hasSpec: false, spec: null, text: prose };
  }

  const hasSpec =
    typeof spec.root === "string" && spec.root.length > 0 && Boolean(spec.elements?.[spec.root]);

  return { hasSpec, spec: hasSpec ? spec : null, text: prose };
}

/** Concatenates the `text` parts of an eve message and reconstructs its spec. */
export function useEveJsonRenderMessage(
  parts: readonly { readonly type: string; readonly text?: string }[],
): EveJsonRenderResult {
  // Separate narration segments (e.g. before vs after a tool call) are distinct
  // text parts; join with a blank line so they don't run together ("variant.It").
  const text = parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .filter((value) => value.length > 0)
    .join("\n\n");

  return extractSpecFromText(text);
}
