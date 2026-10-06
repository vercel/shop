"use client";

import type { EveMessage } from "eve/react";
import { memo } from "react";
import { defaultUrlTransform, Streamdown, type UrlTransform } from "streamdown";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { getCartMutationResult } from "@/lib/agent/cart";

import { ShoppingResults } from "./shopping-results";
import { AgentThinking } from "./thinking";

const SHOPIFY_CDN = "https://cdn.shopify.com/";

const linkSafety = {
  enabled: true,
  onLinkCheck: (url: string) => url.startsWith("/") && !url.startsWith("//"),
};
const urlTransform: UrlTransform = (url, key, node) =>
  key === "src" && !url.startsWith(SHOPIFY_CDN) ? null : defaultUrlTransform(url, key, node);
const Markdown = memo(({ children }: { children: string }) => (
  <Streamdown
    linkSafety={linkSafety}
    urlTransform={urlTransform}
    className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
  >
    {children}
  </Streamdown>
));

function toolLabelName(toolName: string, input: unknown) {
  if (
    toolName !== "connection_execute" ||
    !input ||
    typeof input !== "object" ||
    !("connection" in input) ||
    !("tool" in input)
  )
    return toolName;
  return `${String(input.connection)}__${String(input.tool)}`;
}

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
  const waitsForInput = message.parts.some(
    (part) => part.type === "dynamic-tool" && part.state === "approval-requested",
  );
  return (
    <div className="grid gap-2.5 text-foreground text-sm">
      <AgentThinking
        active={isStreaming && !text}
        tool={
          active?.type === "dynamic-tool" ? toolLabelName(active.toolName, active.input) : undefined
        }
      />
      {text && <Markdown>{text}</Markdown>}
      <ShoppingResults
        confirmation={showsLiveCart ? { warnings } : undefined}
        fallback={
          isLatest && !isStreaming && !text && !waitsForInput ? (
            <p className="text-muted-foreground">No response. Try asking again.</p>
          ) : null
        }
        isLatest={isLatest}
        isStreaming={isStreaming}
        message={message}
      />
    </div>
  );
}
