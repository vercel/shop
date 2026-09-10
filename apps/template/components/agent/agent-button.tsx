"use client";

import { MessageCircle } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

import { readStoredChat } from "@/lib/agent/chat/client";

import { AgentPanel } from "./client";

// The initial snapshot is fixed; the mounted panel owns subsequent storage updates.
function subscribeToInitialSession() {
  return () => {};
}

export function AgentButton() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [hasSavedSession] = useState(() => Boolean(readStoredChat().session));
  const shouldRestore = useSyncExternalStore(
    subscribeToInitialSession,
    () => hasSavedSession,
    () => false,
  );
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
        <span className="sr-only">Open shopping assistant</span>
      </button>
      {(hasOpened || shouldRestore) && (
        <AgentPanel onOpenChange={setOpen} open={open} triggerRef={triggerRef} />
      )}
    </>
  );
}
