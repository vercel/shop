"use client";

import { useEveAgent } from "eve/react";
import { MinusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useScrollContain } from "@/hooks/use-scroll-contain";

import { CartReconciler } from "./cart-reconciler";
import { ChatMessage } from "./chat-message";
import { AgentComposer } from "./composer";

const AGENT_CHAT_STORAGE_KEY = "template-agent-chat:v2";

type AgentSnapshot = ReturnType<typeof useEveAgent>;

type PersistedAgentChat = {
  version: 2;
  input: string;
  session?: AgentSnapshot["session"];
  events?: AgentSnapshot["events"];
};

function readPersistedAgentChat(): PersistedAgentChat {
  const fallback: PersistedAgentChat = { version: 2, input: "" };

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(AGENT_CHAT_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<PersistedAgentChat>;
    if (parsed.version !== 2) return fallback;

    return {
      version: 2,
      input: typeof parsed.input === "string" ? parsed.input : "",
      session: parsed.session,
      events: parsed.events,
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

// The eve conversation (owns useEveAgent). Keyed by the panel so "clear" remounts
// it with a fresh, empty session — reset() alone re-binds the persisted session
// cursor it was constructed with, replaying the old chat.
function AgentConversation({ onContentChange }: { onContentChange: (has: boolean) => void }) {
  const t = useTranslations("agent");
  const [persistedChat] = useState(readPersistedAgentChat);
  const [input, setInput] = useState(persistedChat.input);

  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const agent = useEveAgent({
    initialEvents: persistedChat.events,
    initialSession: persistedChat.session,
    // Ephemeral per-turn page path so the model can resolve "this product"/"this collection".
    prepareSend: (turn) => ({ ...turn, clientContext: { path: pathnameRef.current } }),
  });

  const { data, error, send, session, status } = agent;
  const messages = data.messages;

  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "pinned" when within a small threshold of the bottom.
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }, []);

  // Keep the latest content in view while streaming, unless the reader scrolled up.
  const lastMessage = messages[messages.length - 1];
  const streamSignal = lastMessage ? JSON.stringify(lastMessage.parts).length : 0;
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, streamSignal]);

  useEffect(() => {
    writePersistedAgentChat({ version: 2, input, session, events: agent.events });
  }, [input, session, agent.events]);

  useEffect(() => {
    onContentChange(messages.length > 0 || input.trim().length > 0);
  }, [messages.length, input, onContentChange]);

  const handleSend = useCallback(
    (text: string) => {
      pinnedRef.current = true;
      void send({ message: text });
      setInput("");
    },
    [send],
  );

  return (
    <>
      <CartReconciler messages={messages} />

      <div
        ref={scrollRef}
        data-slot="agent-messages"
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5"
      >
        {messages.length === 0 && <p className="text-sm text-foreground">{t("greeting")}</p>}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={status === "streaming" && index === messages.length - 1}
          />
        ))}
      </div>

      <AgentComposer
        value={input}
        onChange={setInput}
        onSubmit={handleSend}
        status={status}
        placeholder={t("inputPlaceholder")}
      />
      {error && (
        <p className="px-5 pb-2 text-red-500 text-xs">{error.message ?? "Something went wrong."}</p>
      )}
    </>
  );
}

export function AgentPanel({ open, onOpenChange, triggerRef }: AgentPanelProps) {
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
  }, [pathname, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange, triggerRef]);

  useScrollContain(panelRef, open, "[data-slot=agent-messages]");

  const scrollMessagesToBottom = useCallback(() => {
    const el = panelRef.current?.querySelector<HTMLElement>("[data-slot=agent-messages]");
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleClear = useCallback(() => {
    writePersistedAgentChat({ version: 2, input: "" });
    setChatEpoch((epoch) => epoch + 1);
  }, []);

  return (
    <div
      ref={panelRef}
      data-state={open ? "open" : "closed"}
      role="dialog"
      aria-label={t("assistantLabel")}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "opacity" && open) {
          scrollMessagesToBottom();
        }
      }}
      className="fixed right-5 bottom-20 z-40 flex max-h-[min(40rem,80vh)] w-[calc(100vw-2rem)] max-w-160 flex-col overflow-hidden rounded-2xl bg-background/95 shadow-[0px_2px_4px_0px_rgba(90,90,90,0.30)] outline -outline-offset-1 outline-border/35 backdrop-blur-sm transition-[opacity,transform,display] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] transition-discrete data-[state=open]:opacity-100 data-[state=open]:translate-y-0 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2.5 data-[state=closed]:hidden starting:opacity-0 starting:translate-y-2.5"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/35 px-5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{t("name")}</span>
          {t("title") && <span className="text-muted-foreground text-sm">{t("title")}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClear}
            disabled={!canClear}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            aria-label={t("clearChat")}
          >
            <Trash2Icon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={t("minimizeAssistant")}
          >
            <MinusIcon className="size-4" />
          </button>
        </div>
      </div>

      <AgentConversation key={chatEpoch} onContentChange={setCanClear} />
    </div>
  );
}
