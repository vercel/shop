"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { MinusIcon, Trash2Icon } from "lucide-react";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScrollContain } from "@/hooks/use-scroll-contain";

import { CartReconciler } from "./cart-reconciler";
import { ChatMessage } from "./chat-message";
import { AgentComposer } from "./composer";

const AGENT_CHAT_STORAGE_KEY = "template-agent-chat:v3";

interface PersistedAgentChat {
  chatId: string;
  input: string;
  messages: UIMessage[];
  version: 3;
}

function createEmptyPersistedAgentChat(): PersistedAgentChat {
  return { chatId: nanoid(), input: "", messages: [], version: 3 };
}

function readPersistedAgentChat(): PersistedAgentChat {
  const fallback = createEmptyPersistedAgentChat();
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(AGENT_CHAT_STORAGE_KEY) ?? "null",
    ) as Partial<PersistedAgentChat> | null;
    if (!parsed || parsed.version !== 3) return fallback;
    return {
      chatId: typeof parsed.chatId === "string" && parsed.chatId ? parsed.chatId : fallback.chatId,
      input: typeof parsed.input === "string" ? parsed.input : "",
      messages: Array.isArray(parsed.messages) ? (parsed.messages as UIMessage[]) : [],
      version: 3,
    };
  } catch {
    return fallback;
  }
}

function writePersistedAgentChat(chat: PersistedAgentChat): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AGENT_CHAT_STORAGE_KEY, JSON.stringify(chat));
  } catch {
    // Ignore storage failures such as quota exceeded.
  }
}

export interface AgentPanelProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
}

function AgentConversation({ onContentChange }: { onContentChange: (has: boolean) => void }) {
  const t = useTranslations("agent");
  const [persistedChat] = useState(readPersistedAgentChat);
  const [input, setInput] = useState(persistedChat.input);
  const { error, messages, sendMessage, status } = useChat({
    id: persistedChat.chatId,
    messages: persistedChat.messages,
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

  useEffect(() => {
    writePersistedAgentChat({
      chatId: persistedChat.chatId,
      input,
      messages,
      version: 3,
    });
  }, [input, messages, persistedChat.chatId]);

  useEffect(() => {
    onContentChange(messages.length > 0 || input.trim().length > 0);
  }, [input, messages.length, onContentChange]);

  const handleSend = useCallback(
    (text: string) => {
      pinnedRef.current = true;
      void sendMessage({ text });
      setInput("");
    },
    [sendMessage],
  );

  return (
    <>
      <CartReconciler messages={messages} />
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
            <p className="text-sm text-foreground">{t("greeting")}</p>
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
        onSubmit={handleSend}
        placeholder={t("inputPlaceholder")}
        status={status}
        value={input}
      />
      {error && <p className="px-5 pb-2 text-red-500 text-xs">{error.message}</p>}
    </>
  );
}

export function AgentPanel({ onOpenChange, open, triggerRef }: AgentPanelProps) {
  const t = useTranslations("agent");
  const panelRef = useRef<HTMLDivElement>(null);
  const [chatEpoch, setChatEpoch] = useState(0);
  const [canClear, setCanClear] = useState(false);

  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;
    onOpenChange(false);
  }, [onOpenChange, pathname]);

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

  const scrollMessagesToBottom = useCallback(() => {
    const element = panelRef.current?.querySelector<HTMLElement>("[data-slot=agent-messages]");
    if (element) element.scrollTop = element.scrollHeight;
  }, []);

  const handleClear = useCallback(() => {
    writePersistedAgentChat(createEmptyPersistedAgentChat());
    setChatEpoch((epoch) => epoch + 1);
  }, []);

  return (
    <div
      ref={panelRef}
      aria-label={t("assistantLabel")}
      data-state={open ? "open" : "closed"}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === "opacity" && open) {
          scrollMessagesToBottom();
        }
      }}
      role="dialog"
      className="fixed right-5 bottom-20 z-40 flex h-auto max-h-[min(40rem,80vh)] w-[calc(100vw-2rem)] max-w-160 flex-col overflow-hidden rounded-2xl bg-background/95 shadow-[0px_2px_4px_0px_rgba(90,90,90,0.30)] outline -outline-offset-1 outline-border/35 backdrop-blur-sm transition-[opacity,transform,display] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] transition-discrete data-[state=open]:opacity-100 data-[state=open]:translate-y-0 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2.5 data-[state=closed]:hidden starting:opacity-0 starting:translate-y-2.5"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/35 px-5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{t("name")}</span>
          {t("title") && <span className="text-muted-foreground text-sm">{t("title")}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label={t("clearChat")}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            disabled={!canClear}
            onClick={handleClear}
            type="button"
          >
            <Trash2Icon className="size-4" />
          </button>
          <button
            aria-label={t("minimizeAssistant")}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <MinusIcon className="size-4" />
          </button>
        </div>
      </div>
      <AgentConversation key={chatEpoch} onContentChange={setCanClear} />
    </div>
  );
}
