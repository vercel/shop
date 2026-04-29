"use client";

import { MessageCircle } from "lucide-react";
import { useRef, useState } from "react";

import { AgentPanel } from "./client";

export function AgentButton() {
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
      >
        <MessageCircle className="size-4" />
        <span className="sr-only">Agent</span>
      </button>
      {open && <AgentPanel open={open} onOpenChange={setOpen} triggerRef={triggerRef} />}
    </>
  );
}
