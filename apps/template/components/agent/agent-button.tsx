"use client";

import { BotMessageSquare } from "lucide-react";
import { useRef, useState } from "react";
import { AgentPanel } from "./client";

export function AgentButton() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setHasOpened(true);
    }
    setOpen(nextOpen);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-1.5 px-2 py-1"
        onClick={() => handleOpenChange(!open)}
        aria-expanded={open}
      >
        <BotMessageSquare className="size-4 text-primary" />
        <span className="text-xs font-medium text-primary">Agent</span>
      </button>
      {hasOpened && (
        <AgentPanel
          open={open}
          onOpenChange={handleOpenChange}
          triggerRef={triggerRef}
        />
      )}
    </>
  );
}
