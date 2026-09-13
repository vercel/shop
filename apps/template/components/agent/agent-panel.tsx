"use client";

import { useEveAgent } from "eve/react";
import { Trash2Icon, XIcon } from "lucide-react";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { setAgentCartStatus, useAgentCartPending } from "@/lib/agent/cart/client";
import { readStoredChat, writeStoredChat } from "@/lib/agent/chat/client";

import { AgentCartBridge } from "./cart-bridge";
import { ChatMessage } from "./chat-message";
import { AgentComposer } from "./composer";

const CANCEL_TIMEOUT_MS = 10_000;

export interface AgentPanelProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
}

export function AgentPanel({ onOpenChange, open, triggerRef }: AgentPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [stored] = useState(readStoredChat);
  const [input, setInput] = useState(stored.input);
  const snapshot = useRef(stored);
  const [clearing, setClearing] = useState(false);
  const clearAttempt = useRef<{
    reject: (error: Error) => void;
    resolve: () => void;
  } | null>(null);
  const cartPending = useAgentCartPending();
  const [controlError, setControlError] = useState<string | null>(null);
  const agent = useEveAgent({
    initialSession: stored.session,
    onError(cause) {
      clearAttempt.current?.reject(cause);
    },
    onFinish(finished) {
      if (finished.error) clearAttempt.current?.reject(finished.error);
      else clearAttempt.current?.resolve();
    },
    onSessionChange(session) {
      snapshot.current.session = session ? { ...session, streamIndex: 0 } : undefined;
      writeStoredChat(snapshot.current);
    },
    async prepareSend(turn) {
      const response = await fetch("/api/agent/session", {
        credentials: "same-origin",
        method: "POST",
        redirect: "error",
      });
      if (!response.ok) throw new Error("Could not prepare the assistant. Please try again.");
      return {
        ...turn,
        clientContext: { pathname: location.pathname, search: location.search },
        turnPolicy: "queue",
      };
    },
    resume: Boolean(stored.session),
  });
  const {
    data: { messages },
    error,
    status,
  } = agent;
  const busy = status === "submitted" || status === "streaming" || status === "resuming";
  const hasReachedLimit = messages.some((message) =>
    message.parts.some(
      (part) =>
        part.type === "dynamic-tool" &&
        part.state === "approval-requested" &&
        part.toolMetadata?.eve?.inputRequest?.kind === "session-limit",
    ),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const userScrollRef = useRef(false);
  const pointerDownRef = useRef(false);
  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, []);
  const markUserScroll = useCallback(() => {
    userScrollRef.current = true;
  }, []);
  // Programmatic scrolls also fire scroll events; only user input may unpin from the bottom.
  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
    if (atBottom) pinnedRef.current = true;
    else if (userScrollRef.current || pointerDownRef.current) pinnedRef.current = false;
    userScrollRef.current = false;
  }, []);
  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) scrollToBottom();
    });
    observer.observe(content);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [scrollToBottom]);
  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, scrollToBottom]);
  const [restoreDelayElapsed, setRestoreDelayElapsed] = useState(false);
  useEffect(() => {
    if (status !== "resuming") return;
    const timer = setTimeout(() => setRestoreDelayElapsed(true), 400);
    return () => clearTimeout(timer);
  }, [status]);
  const showRestoring = status === "resuming" && restoreDelayElapsed;
  useEffect(() => {
    snapshot.current.input = input;
    const timer = setTimeout(() => writeStoredChat(snapshot.current), 400);
    return () => clearTimeout(timer);
  }, [input]);
  useEffect(() => {
    const flush = () => writeStoredChat(snapshot.current);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
      clearAttempt.current?.reject(new Error("Conversation closed"));
      clearAttempt.current = null;
    };
  }, []);
  function clearChat() {
    setAgentCartStatus("pending");
    agent.reset();
    setInput("");
    setClearing(false);
    setControlError(null);
    snapshot.current = { input: "" };
    writeStoredChat(snapshot.current);
  }
  const handleStop = () => {
    setControlError(null);
    void agent.cancel().catch(() => {
      setControlError("Could not stop the response. Please try again.");
    });
  };
  const handleSend = (text: string) => {
    if (busy || clearing || cartPending || hasReachedLimit) return;
    pinnedRef.current = true;
    setAgentCartStatus("pending");
    setControlError(null);
    void agent
      .send(text)
      .catch(() =>
        setControlError(
          "Could not send your message. Try again, or clear an expired conversation.",
        ),
      );
    setInput("");
  };
  const handleClear = async () => {
    if (clearAttempt.current) return;
    setClearing(true);
    setControlError(null);
    const attempt = Promise.withResolvers<void>();
    clearAttempt.current = attempt;
    const timeout = setTimeout(
      () => attempt.reject(new Error("Cancellation timed out")),
      CANCEL_TIMEOUT_MS,
    );
    try {
      void agent.cancel().then((result) => {
        if (result.status === "no_active_turn") attempt.resolve();
      }, attempt.reject);
      await attempt.promise;
      if (clearAttempt.current !== attempt) return;
      clearChat();
      if (busy || status === "error")
        setControlError(
          "Started a new chat. Check your cart before repeating an interrupted change.",
        );
    } catch {
      if (clearAttempt.current === attempt)
        setControlError(
          "Could not confirm the response stopped. Your conversation was kept. Try Stop or Clear again.",
        );
    } finally {
      clearTimeout(timeout);
      if (clearAttempt.current === attempt) {
        clearAttempt.current = null;
        setClearing(false);
      }
    }
  };
  return (
    <Sheet
      onOpenChange={(next) => onOpenChange(next)}
      onOpenChangeComplete={(opened) => {
        if (opened) scrollToBottom();
      }}
      open={open}
    >
      <SheetContent
        ref={panelRef}
        className="gap-0 p-0"
        closeButton={false}
        finalFocus={triggerRef}
        initialFocus={() => panelRef.current?.querySelector("textarea") ?? true}
        keepMounted
        overlay={false}
        side="right"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-2.5">
          <SheetTitle className="font-normal text-xl leading-4">Shop Agent</SheetTitle>
          <div className="flex items-center gap-2.5">
            <button
              aria-label="Clear chat"
              className="flex cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              disabled={clearing || (!messages.length && !input.trim() && !agent.session && !busy)}
              onClick={handleClear}
              type="button"
            >
              <Trash2Icon className="size-5" />
            </button>
            <SheetClose
              aria-label="Close Shop Agent"
              className="flex cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <XIcon className="size-5" />
            </SheetClose>
          </div>
        </div>
        <SheetDescription className="sr-only">
          Find products, ask store questions, and manage your cart.
        </SheetDescription>
        <div
          ref={scrollRef}
          data-slot="agent-messages"
          onKeyDown={markUserScroll}
          onPointerDown={() => {
            pointerDownRef.current = true;
          }}
          onPointerUp={() => {
            pointerDownRef.current = false;
          }}
          onScroll={handleScroll}
          onTouchMove={markUserScroll}
          onWheel={markUserScroll}
          className="min-h-0 flex-auto overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div
            ref={contentRef}
            className="flex min-h-full flex-col justify-end gap-6 px-2.5 py-5 [&>*]:shrink-0"
          >
            {messages.length === 0 ? (
              status === "resuming" ? (
                showRestoring && (
                  <p className="text-muted-foreground text-sm">Restoring your conversation…</p>
                )
              ) : (
                <p className="text-foreground text-sm">Hi, how can I help?</p>
              )
            ) : (
              messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  isLatest={index === messages.length - 1}
                  isStreaming={status === "streaming" && index === messages.length - 1}
                  message={message}
                />
              ))
            )}
          </div>
        </div>
        {(clearing || (showRestoring && messages.length > 0)) && (
          <p role="status" className="px-2.5 py-2 text-muted-foreground text-xs">
            {clearing
              ? "Waiting for the response to stop…"
              : "Restoring your conversation… Clear chat to start fresh."}
          </p>
        )}
        {hasReachedLimit && (
          <p role="alert" className="px-2.5 py-2 text-muted-foreground text-xs">
            This conversation has reached its limit. Clear chat to start a new conversation.
          </p>
        )}
        <AgentCartBridge messages={messages} status={status} />
        <AgentComposer
          disabled={!busy && (clearing || cartPending || hasReachedLimit)}
          onChange={setInput}
          onStop={handleStop}
          onSubmit={handleSend}
          placeholder="Ask anything…"
          status={status}
          value={input}
        />
        {(error || controlError) && (
          <p role="alert" className="px-2.5 pb-2 text-red-500 text-xs">
            {controlError ??
              "The assistant is unavailable. Try again, or clear an expired conversation."}
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
