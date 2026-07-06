"use client";

import { JSONUIProvider, Renderer } from "@json-render/react";
import type { EveMessage } from "eve/react";
import { memo } from "react";
import { Streamdown } from "streamdown";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";

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
    <Streamdown
      linkSafety={linkSafety}
      className="size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    >
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
      <Message align="end">
        <MessageContent>
          <Bubble variant="secondary">
            <BubbleContent>
              <Markdown>{text}</Markdown>
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message align="start">
      <MessageContent>
        <AgentReasoning parts={message.parts} isStreaming={isStreaming} />
        {text && <Markdown>{text}</Markdown>}
        {hasSpec && spec && (
          <JSONUIProvider registry={registry}>
            <Renderer spec={spec} registry={registry} />
          </JSONUIProvider>
        )}
      </MessageContent>
    </Message>
  );
}
