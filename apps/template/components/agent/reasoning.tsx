"use client";

import type { EveMessage } from "eve/react";
import {
  BrainIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  DotIcon,
  FileTextIcon,
  FolderOpenIcon,
  LayoutGridIcon,
  Loader2Icon,
  type LucideIcon,
  MapPinIcon,
  NavigationIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StickyNoteIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { cn } from "@/lib/utils";

const AUTO_CLOSE_DELAY = 1000;

type MessagePart = EveMessage["parts"][number];

const TOOL_METADATA: Record<string, { label: string; icon: LucideIcon }> = {
  search_products: { label: "Searching products", icon: SearchIcon },
  get_product_details: { label: "Looking up product details", icon: PackageIcon },
  get_product_recommendations: { label: "Finding recommendations", icon: SparklesIcon },
  list_collections: { label: "Listing collections", icon: LayoutGridIcon },
  browse_collection: { label: "Browsing collection", icon: FolderOpenIcon },
  add_to_cart: { label: "Adding to cart", icon: PlusIcon },
  get_cart: { label: "Checking cart", icon: ShoppingCartIcon },
  update_cart_item_quantity: { label: "Updating cart", icon: SettingsIcon },
  remove_from_cart: { label: "Removing from cart", icon: Trash2Icon },
  add_cart_note: { label: "Adding cart note", icon: StickyNoteIcon },
  navigate_user: { label: "Navigating", icon: NavigationIcon },
  get_order_history: { label: "Looking up orders", icon: ClipboardListIcon },
  get_order_details: { label: "Fetching order details", icon: FileTextIcon },
  get_addresses: { label: "Loading addresses", icon: MapPinIcon },
  manage_address: { label: "Managing address", icon: MapPinIcon },
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
  const [hasAutoClosed, setHasAutoClosed] = useState(false);

  useEffect(() => {
    if (hasActiveWork) {
      setIsOpen(true);
    } else if (chainParts.length > 0 && isOpen && !hasAutoClosed) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        setHasAutoClosed(true);
      }, AUTO_CLOSE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [hasActiveWork, chainParts.length, isOpen, hasAutoClosed]);

  if (chainParts.length === 0) return null;

  const lastPart = chainParts[chainParts.length - 1];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="group flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground">
        {hasActiveWork ? (
          <span className="shimmer">Working…</span>
        ) : (
          <span>
            Worked through {chainParts.length} step{chainParts.length === 1 ? "" : "s"}
          </span>
        )}
        <ChevronDownIcon className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-1.5 pt-2">
          {chainParts.map((part, index) => {
            const isReasoning = part.type === "reasoning";
            const active = isReasoning ? isStreaming && part === lastPart : !isPartComplete(part);
            const meta = isReasoning
              ? { label: "Thinking", icon: BrainIcon }
              : (TOOL_METADATA[getToolName(part) ?? ""] ?? {
                  label: getToolName(part) ?? "Working",
                  icon: DotIcon,
                });
            const Icon = meta.icon;

            return (
              <Marker key={partKey(part, index)} className={cn(active && "text-foreground")}>
                <MarkerIcon>
                  {active ? <Loader2Icon className="animate-spin" /> : <Icon />}
                </MarkerIcon>
                <MarkerContent>{meta.label}</MarkerContent>
              </Marker>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
