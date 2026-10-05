"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AgentPanel } from "./client";

export function AgentButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Mount the drawer closed once the page is idle so the first open is a plain slide-in.
  useEffect(() => {
    const idle =
      window.requestIdleCallback ?? ((callback: () => void) => setTimeout(callback, 200));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const handle = idle(() => setMounted(true));
    return () => cancel(handle as number);
  }, []);
  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1.5 px-2 py-1"
        onClick={() => {
          setMounted(true);
          setOpen((previous) => !previous);
        }}
        type="button"
      >
        <MessageCircle className="size-4 text-primary" />
        <span className="sr-only">Open Shop Agent</span>
      </button>
      {mounted && <AgentPanel onOpenChange={setOpen} open={open} triggerRef={triggerRef} />}
    </>
  );
}
