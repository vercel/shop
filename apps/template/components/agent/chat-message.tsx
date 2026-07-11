"use client";

import { buildSpecFromParts, getTextFromParts, JSONUIProvider, Renderer } from "@json-render/react";
import type { UIMessage } from "ai";
import { memo } from "react";
import { Streamdown } from "streamdown";

import { Bubble, BubbleContent } from "@/components/ui/bubble";

import { registry } from "./registry";
import { AgentThinking } from "./thinking";

const linkSafety = {
  enabled: true,
  onLinkCheck: (url: string) => url.startsWith("/"),
};

const Markdown = memo(
  ({ children }: { children: string }) => (
    <Streamdown linkSafety={linkSafety} className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {children}
    </Streamdown>
  ),
  (previous, next) => previous.children === next.children,
);
Markdown.displayName = "Markdown";

export function ChatMessage({
  isStreaming,
  message,
}: {
  isStreaming: boolean;
  message: UIMessage;
}) {
  // AI SDK mutates parts in place, so reference-based memoization misses later spec patches.
  const spec = buildSpecFromParts(message.parts);
  const text = getTextFromParts(message.parts);
  const hasSpec = spec !== null && Object.keys(spec.elements ?? {}).length > 0;

  if (message.role === "user") {
    if (!text) return null;
    return (
      <div className="flex justify-end">
        <Bubble className="max-w-[85%]" variant="default">
          <BubbleContent className="rounded-2xl px-3.5">
            <Markdown>{text}</Markdown>
          </BubbleContent>
        </Bubble>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 text-sm text-foreground">
      <AgentThinking active={isStreaming && !text} />
      {text && <Markdown>{text}</Markdown>}
      {!isStreaming && hasSpec && spec && (
        <JSONUIProvider registry={registry}>
          <Renderer registry={registry} spec={spec} />
        </JSONUIProvider>
      )}
    </div>
  );
}
