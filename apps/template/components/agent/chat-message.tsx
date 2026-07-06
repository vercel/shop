"use client";

import { JSONUIProvider, Renderer } from "@json-render/react";
import type { EveMessage } from "eve/react";
import { CheckIcon, CopyIcon, SparklesIcon } from "lucide-react";
import { memo, useState } from "react";
import { Streamdown } from "streamdown";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Message, MessageAvatar, MessageContent, MessageFooter } from "@/components/ui/message";

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Copied" : "Copy message"}
      className="text-muted-foreground opacity-0 transition-opacity group-hover/message:opacity-100 focus-visible:opacity-100"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
    </Button>
  );
}

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
          <Bubble variant="default">
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
      <MessageAvatar className="size-7 text-primary">
        <SparklesIcon className="size-4" />
      </MessageAvatar>
      <MessageContent>
        <AgentReasoning parts={message.parts} isStreaming={isStreaming} />
        {(text || (hasSpec && spec)) && (
          <Bubble variant="muted">
            <BubbleContent>
              {text && <Markdown>{text}</Markdown>}
              {hasSpec && spec && (
                <JSONUIProvider registry={registry}>
                  <Renderer spec={spec} registry={registry} />
                </JSONUIProvider>
              )}
            </BubbleContent>
          </Bubble>
        )}
        {text && (
          <MessageFooter className="-mx-1">
            <CopyButton text={text} />
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}
