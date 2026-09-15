"use client";

import type { EveMessage } from "eve/react";
import { memo } from "react";
import { Streamdown } from "streamdown";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { getCartMutationResult } from "@/lib/agent/cart";

import { ShoppingResults } from "./shopping-results";
import { AgentThinking } from "./thinking";

const linkSafety = {
  enabled: true,
  onLinkCheck: (url: string) => url.startsWith("/") && !url.startsWith("//"),
};
const Markdown = memo(({ children }: { children: string }) => (
  <Streamdown linkSafety={linkSafety} className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
    {children}
  </Streamdown>
));

export function ChatMessage({
  isLatest,
  isStreaming,
  message,
}: {
  isLatest: boolean;
  isStreaming: boolean;
  message: EveMessage;
}) {
  const text = message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("");
  if (message.role === "user")
    return text ? (
      <div className="flex justify-end">
        <Bubble className="max-w-[85%]" variant="default">
          <BubbleContent className="rounded-lg px-3.5">
            <Markdown>{text}</Markdown>
          </BubbleContent>
        </Bubble>
      </div>
    ) : null;
  const mutations = message.parts.flatMap((part) => {
    const result = getCartMutationResult(part);
    return result ? [result] : [];
  });
  const warnings = [...new Set(mutations.flatMap((mutation) => mutation.warnings))];
  const showsLiveCart = isLatest && mutations.length > 0;
  const active = message.parts.find(
    (part) =>
      part.type === "dynamic-tool" &&
      part.state !== "output-available" &&
      part.state !== "output-error",
  );
  return (
    <div className="grid gap-2.5 text-foreground text-sm">
      <AgentThinking
        active={isStreaming && !text}
        tool={active?.type === "dynamic-tool" ? active.toolName : undefined}
      />
      {text && <Markdown>{text}</Markdown>}
      <ShoppingResults
        confirmation={showsLiveCart ? { warnings } : undefined}
        isLatest={isLatest}
        isStreaming={isStreaming}
        message={message}
      />
    </div>
  );
}
