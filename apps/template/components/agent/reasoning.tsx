"use client";

import type { EveMessage } from "eve/react";
import { useEffect, useRef, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { cn } from "@/lib/utils";

const AUTO_CLOSE_DELAY = 1000;

type MessagePart = EveMessage["parts"][number];

const TOOL_LABELS: Record<string, string> = {
  add_cart_note: "Adding cart note",
  add_to_cart: "Adding to cart",
  browse_collection: "Browsing collection",
  get_addresses: "Loading addresses",
  get_cart: "Checking cart",
  get_order_details: "Fetching order details",
  get_order_history: "Looking up orders",
  get_product_details: "Looking up product details",
  get_product_recommendations: "Finding recommendations",
  list_collections: "Listing collections",
  manage_address: "Managing address",
  navigate_user: "Navigating",
  remove_from_cart: "Removing from cart",
  search_products: "Searching products",
  update_cart_item_quantity: "Updating cart",
};

function getToolName(part: MessagePart): string | null {
  if (part.type === "dynamic-tool" && "toolName" in part) {
    return part.toolName as string;
  }
  return null;
}

function isPartComplete(part: MessagePart): boolean {
  if (!("state" in part)) return true;
  return ["output-available", "output-error", "output-denied"].includes(part.state as string);
}

function partKey(part: MessagePart, index: number): string {
  if ("toolCallId" in part && typeof part.toolCallId === "string") {
    return `${part.type}-${part.toolCallId}`;
  }
  return `${part.type}-${index}`;
}

function stepLabel(part: MessagePart): string {
  if (part.type === "reasoning") return "Thinking";
  const name = getToolName(part);
  return (name && TOOL_LABELS[name]) || name || "Working";
}

export function AgentReasoning({
  parts,
  isStreaming,
}: {
  parts: EveMessage["parts"];
  isStreaming: boolean;
}) {
  const chainParts = parts.filter(
    (part) => part.type === "reasoning" || getToolName(part) !== null,
  );

  const hasActiveWork = chainParts.some((part) =>
    part.type === "reasoning" ? isStreaming : !isPartComplete(part),
  );

  const [isOpen, setIsOpen] = useState(hasActiveWork);
  const wasActiveRef = useRef(hasActiveWork);

  useEffect(() => {
    if (hasActiveWork) {
      wasActiveRef.current = true;
      setIsOpen(true);
      return;
    }
    // Auto-collapse once, only for a chain we watched finish this session — never a
    // restored/complete block, and never fighting a manual expand.
    if (wasActiveRef.current) {
      wasActiveRef.current = false;
      const timer = setTimeout(() => setIsOpen(false), AUTO_CLOSE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [hasActiveWork]);

  if (chainParts.length === 0) return null;

  const lastPart = chainParts[chainParts.length - 1];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="flex cursor-pointer items-center text-sm text-muted-foreground outline-none transition-colors hover:text-foreground">
        {hasActiveWork ? (
          <span className="shimmer">Working…</span>
        ) : (
          <span>
            Worked through {chainParts.length} step{chainParts.length === 1 ? "" : "s"}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-1 pt-2">
          {chainParts.map((part, index) => {
            const active =
              part.type === "reasoning" ? isStreaming && part === lastPart : !isPartComplete(part);
            return (
              <Marker key={partKey(part, index)}>
                <MarkerContent className={cn(active && "shimmer")}>{stepLabel(part)}</MarkerContent>
              </Marker>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
