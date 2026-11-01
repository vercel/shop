"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { readStoredChat } from "@/lib/agent/chat/client";

import { AgentPanel } from "./client";

export function AgentButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // The panel is most of the agent's JavaScript, so it loads on intent; a turn interrupted by navigation mounts it at idle so its cart writes reconcile.
  useEffect(() => {
    if (!readStoredChat().turnActive) return;
    const idle =
      window.requestIdleCallback ?? ((callback: () => void) => setTimeout(callback, 200));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const handle = idle(() => setMounted(true));
    return () => cancel(handle as number);
  }, []);
  const mount = () => setMounted(true);
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
        onFocus={mount}
        onPointerEnter={mount}
        onTouchStart={mount}
        type="button"
      >
        <MessageCircle className="size-4 text-primary" />
        <span className="sr-only">Open Shop Agent</span>
      </button>
      {mounted && <AgentPanel onOpenChange={setOpen} open={open} triggerRef={triggerRef} />}
    </>
  );
}
