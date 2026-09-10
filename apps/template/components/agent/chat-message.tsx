"use client";

import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import type { EveMessage } from "eve/react";
import { memo } from "react";
import { Streamdown } from "streamdown";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { isCartMutation } from "@/lib/agent/commerce";

import { AgentProductProvider } from "./product-context";
import { registry } from "./registry";
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

function shoppingSpec(message: EveMessage): Spec | null {
  const children: string[] = [];
  const elements: Spec["elements"] = { response: { type: "AgentResponse", props: {}, children } };
  const seen = new Set<string>();
  for (const part of message.parts) {
    if (part.type !== "dynamic-tool" || part.state !== "output-available" || part.partial) continue;
    const output = part.output;
    if (!output || typeof output !== "object" || "error" in output) continue;
    const key = part.toolCallId;
    if (
      ["present-products", "search-products", "browse-collection", "get-recommendations"].includes(
        part.toolName,
      ) &&
      "products" in output &&
      Array.isArray(output.products)
    ) {
      const cards: string[] = [];
      for (const [index, product] of output.products.entries()) {
        if (
          !product ||
          typeof product !== "object" ||
          typeof product.handle !== "string" ||
          seen.has(product.handle)
        )
          continue;
        seen.add(product.handle);
        const card = `${key}-${index}`;
        cards.push(card);
        elements[card] = {
          type: "AgentProductCard",
          props: { handle: product.handle },
          children: [],
        };
      }
      if (cards.length) {
        children.push(key);
        elements[key] = { type: "AgentProductGrid", props: { title: null }, children: cards };
      }
    }
    if (
      part.toolName === "get-product-details" &&
      "product" in output &&
      output.product &&
      typeof output.product === "object" &&
      "handle" in output.product &&
      typeof output.product.handle === "string"
    ) {
      children.push(key);
      elements[key] = {
        type: "AgentVariantPicker",
        props: { handle: output.product.handle },
        children: [],
      };
    }
    if (part.toolName === "get-cart" || isCartMutation(part.toolName)) {
      if (!elements.cart) children.push("cart");
      elements.cart = { type: "AgentCartSummary", props: {}, children: [] };
    }
  }
  return children.length ? { root: "response", elements } : null;
}

export function ChatMessage({
  isStreaming,
  message,
}: {
  isStreaming: boolean;
  message: EveMessage;
}) {
  const text = message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("");
  if (message.role === "user")
    return text ? (
      <div className="flex justify-end">
        <Bubble className="max-w-[85%]" variant="default">
          <BubbleContent className="rounded-2xl px-3.5">
            <Markdown>{text}</Markdown>
          </BubbleContent>
        </Bubble>
      </div>
    ) : null;
  const spec = shoppingSpec(message);
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
      {spec && (
        <AgentProductProvider parts={message.parts}>
          <JSONUIProvider registry={registry}>
            <Renderer registry={registry} spec={spec} />
          </JSONUIProvider>
        </AgentProductProvider>
      )}
    </div>
  );
}
