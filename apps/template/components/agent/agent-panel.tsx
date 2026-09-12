"use client";

import { useEveAgent } from "eve/react";
import { MinusIcon, Trash2Icon } from "lucide-react";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import { useScrollContain } from "@/hooks/use-scroll-contain";
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
  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (element)
      pinnedRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
  }, []);
  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) scroller.scrollTop = scroller.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);
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
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      )
        onOpenChange(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onOpenChange, open, triggerRef]);
  useScrollContain(panelRef, open, "[data-slot=agent-messages]");
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
    <div
      ref={panelRef}
      aria-label="Shop Agent"
      data-state={open ? "open" : "closed"}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === "opacity" && open) {
          const element = scrollRef.current;
          if (element) element.scrollTop = element.scrollHeight;
        }
      }}
      role="dialog"
      className="fixed right-5 bottom-18.5 z-40 flex h-auto max-h-[min(40rem,80vh)] w-[calc(100vw-2rem)] max-w-160 flex-col overflow-hidden rounded-2xl bg-background/95 shadow-[0px_2px_4px_0px_rgba(90,90,90,0.30)] outline -outline-offset-1 outline-border/35 backdrop-blur-sm transition-[opacity,transform,display] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] transition-discrete data-[state=open]:opacity-100 data-[state=open]:translate-y-0 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2.5 data-[state=closed]:hidden starting:opacity-0 starting:translate-y-2.5"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/35 px-5 py-2.5">
        <span className="font-semibold text-sm">Shop Agent</span>
        <div className="flex items-center gap-1">
          <button
            aria-label="Clear chat"
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            disabled={clearing || (!messages.length && !input.trim() && !agent.session && !busy)}
            onClick={handleClear}
            type="button"
          >
            <Trash2Icon className="size-4" />
          </button>
          <button
            aria-label="Minimize Shop Agent"
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <MinusIcon className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        data-slot="agent-messages"
        onScroll={handleScroll}
        className="min-h-0 flex-auto overflow-y-auto overscroll-contain"
      >
        <div
          ref={contentRef}
          className="flex min-h-full flex-col justify-end gap-6 p-5 [&>*]:shrink-0"
        >
          {messages.length === 0 ? (
            <p className="text-foreground text-sm">
              {status === "resuming" ? "Restoring your conversation…" : "Hi, how can I help?"}
            </p>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                isStreaming={status === "streaming" && index === messages.length - 1}
                message={message}
              />
            ))
          )}
        </div>
      </div>
      {(clearing || (status === "resuming" && messages.length > 0)) && (
        <p role="status" className="px-5 py-2 text-muted-foreground text-xs">
          {clearing
            ? "Waiting for the response to stop…"
            : "Restoring your conversation… Clear chat to start fresh."}
        </p>
      )}
      {hasReachedLimit && (
        <p role="alert" className="px-5 py-2 text-muted-foreground text-xs">
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
        <p role="alert" className="px-5 pb-2 text-red-500 text-xs">
          {controlError ??
            "The assistant is unavailable. Try again, or clear an expired conversation."}
        </p>
      )}
    </div>
  );
}
