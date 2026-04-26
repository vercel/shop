"use client";

import { MessageCircle } from "lucide-react";
import { useRef, useState } from "react";

import type { Locale, NamespaceMessages } from "@/lib/i18n";

import { AgentPanel } from "./client";

interface AgentButtonClientProps {
  agentLabels: NamespaceMessages<"agent">;
  cartLabels: NamespaceMessages<"cart">;
  locale: Locale;
  productLabels: NamespaceMessages<"product">;
}

export function AgentButtonClient({
  agentLabels,
  cartLabels,
  locale,
  productLabels,
}: AgentButtonClientProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-1.5 px-2 py-1"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={agentLabels.openAssistant}
      >
        <MessageCircle className="size-4 text-primary" />
        <span className="sr-only">{agentLabels.name}</span>
      </button>
      {open && (
        <AgentPanel
          agentLabels={agentLabels}
          cartLabels={cartLabels}
          locale={locale}
          productLabels={productLabels}
          open={open}
          onOpenChange={setOpen}
          triggerRef={triggerRef}
        />
      )}
    </>
  );
}
