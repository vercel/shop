"use client";

import { cn } from "cn";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AgentPanel } from "./client";

interface AgentButtonProps {
  position?: "fixed" | "inline";
}

export function AgentButton({ position = "fixed" }: AgentButtonProps) {
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
        className={cn(
          "flex cursor-pointer items-center justify-center transition-colors",
          position === "fixed" ? "gap-1.5 px-2 py-1" : "text-foreground hover:text-foreground/80",
        )}
        onClick={() => {
          setMounted(true);
          setOpen((previous) => !previous);
        }}
        type="button"
      >
        <MessageCircle className={position === "fixed" ? "size-4 text-primary" : "size-5"} />
        <span className="sr-only">Open Shop Agent</span>
      </button>
      {mounted && <AgentPanel onOpenChange={setOpen} open={open} triggerRef={triggerRef} />}
    </>
  );
}
