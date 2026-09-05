"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { MinusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScrollContain } from "@/hooks/use-scroll-contain";
import { BOTID_DENIED_CODE } from "@/lib/botid";

import { AgentCartBridge } from "./cart-bridge";
import { ChatMessage } from "./chat-message";
import { AgentComposer } from "./composer";

const STORAGE_KEY = "template-agent-chat";

const DRAFT_DEBOUNCE_MS = 400;

interface StoredChat {
  input: string;
  messages: UIMessage[];
}

function readStoredChat(): StoredChat {
  if (typeof window === "undefined") return { input: "", messages: [] };
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<StoredChat> | null;
    return {
      input: typeof parsed?.input === "string" ? parsed.input : "",
      messages: Array.isArray(parsed?.messages) ? parsed.messages : [],
    };
  } catch {
    return { input: "", messages: [] };
  }
}

function writeStoredChat(chat: StoredChat): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
  } catch {
    // Ignore storage failures such as quota exceeded.
  }
}

export interface AgentPanelProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function AgentPanel({ onOpenChange, open, triggerRef }: AgentPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [stored] = useState(readStoredChat);
  const [input, setInput] = useState(stored.input);
  const { error, messages, setMessages, sendMessage, status, stop } = useChat({
    messages: stored.messages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
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

  // Drafts change per keystroke, so debounce to avoid re-serializing the transcript each time.
  useEffect(() => {
    const timer = setTimeout(() => writeStoredChat({ input, messages }), DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, messages]);
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
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
  const handleSend = useCallback(
    (text: string) => {
      pinnedRef.current = true;
      void sendMessage({ text });
      setInput("");
    },
    [sendMessage],
  );
  const handleClear = useCallback(() => {
    stop();
    setMessages([]);
    setInput("");
    writeStoredChat({ input: "", messages: [] });
  }, [setMessages, stop]);
  const canClear = messages.length > 0 || input.trim().length > 0;
  return (
    <div
      ref={panelRef}
      aria-label="Shopping assistant"
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
      <AgentCartBridge messages={messages} />
      <div className="flex shrink-0 items-center justify-between border-b border-border/35 px-5 py-2.5">
        <span className="font-semibold text-sm">Shop Assistant</span>
        <div className="flex items-center gap-1">
          <button
            aria-label="Clear chat"
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            disabled={!canClear}
            onClick={handleClear}
            type="button"
          >
            <Trash2Icon className="size-4" />
          </button>
          <button
            aria-label="Minimize assistant"
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
            <p className="text-foreground text-sm">Hi, how can I help?</p>
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
      <AgentComposer
        onChange={setInput}
        onStop={stop}
        onSubmit={handleSend}
        placeholder="Ask anything…"
        status={status}
        value={input}
      />
      {error && (
        <p className="px-5 pb-2 text-red-500 text-xs">
          {error.message.includes(BOTID_DENIED_CODE)
            ? "We couldn't verify this request. Reload the page and try again."
            : "Something went wrong. Try again."}
        </p>
      )}
    </div>
  );
}
