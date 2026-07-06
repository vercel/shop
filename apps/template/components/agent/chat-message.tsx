"use client";

import { JSONUIProvider, Renderer } from "@json-render/react";
import type { EveMessage } from "eve/react";
import { memo } from "react";
import { Streamdown } from "streamdown";

import { Bubble, BubbleContent } from "@/components/ui/bubble";

import { useEveJsonRenderMessage } from "./eve-json-render";
import { AgentReasoning } from "./reasoning";
import { registry } from "./registry";

// Safelist relative paths so navigate_user links (e.g. "/cart") skip the external-link modal.
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
  (prev, next) => prev.children === next.children,
);
Markdown.displayName = "Markdown";

export function ChatMessage({
  message,
  isStreaming,
}: {
  message: EveMessage;
  isStreaming: boolean;
}) {
  const { hasSpec, spec, text } = useEveJsonRenderMessage(message.parts);

  if (message.role === "user") {
    if (!text) return null;
    return (
      <div className="flex justify-end">
        <Bubble variant="default" className="max-w-[85%]">
          <BubbleContent className="rounded-2xl px-3.5">
            <Markdown>{text}</Markdown>
          </BubbleContent>
        </Bubble>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 text-sm text-foreground">
      <AgentReasoning parts={message.parts} isStreaming={isStreaming} />
      {text && <Markdown>{text}</Markdown>}
      {/* Render generative cards only once the turn settles — mid-stream the spec
          fence is partial and compiles to a wrong/half card (the "card flash"). */}
      {!isStreaming && hasSpec && spec && (
        <JSONUIProvider registry={registry}>
          <Renderer spec={spec} registry={registry} />
        </JSONUIProvider>
      )}
    </div>
  );
}
