"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { AgentPanel } from "./client";

export function AgentButton() {
  const t = useTranslations("agent");
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1.5 px-2 py-1"
        onClick={() => {
          setHasOpened(true);
          setOpen((previous) => !previous);
        }}
        type="button"
      >
        <MessageCircle className="size-4 text-primary" />
        <span className="sr-only">{t("openAssistant")}</span>
      </button>
      {/* Mount on first open, then keep mounted so the panel keeps chat state and can animate out. */}
      {hasOpened && <AgentPanel onOpenChange={setOpen} open={open} triggerRef={triggerRef} />}
    </>
  );
}
