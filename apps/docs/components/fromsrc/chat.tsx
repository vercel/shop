"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import {
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  CornerDownLeftIcon,
  Loader2Icon,
  SquareIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/chatdb";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import type { MyUIMessage } from "@/app/api/chat/types";
import { Metadata } from "@/components/fromsrc/metadata";
import { useChatState } from "@/lib/chatstate";
import { cn } from "@/lib/utils";

const hints = [
  "What is Vercel Shop?",
  "How does the cart work?",
  "How do I customize the store?",
  "How do I extend with agents?",
];

function Shimmer({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs text-muted-foreground animate-pulse">
      {children}
    </span>
  );
}

function ChatInner({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [transport] = useState(() => new DefaultChatTransport({
    api: "/api/chat",
    body: () => ({ currentRoute: pathnameRef.current }),
  }));

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport,
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const initialized = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storedMessages = useLiveQuery(() =>
    db.messages.orderBy("sequence").toArray()
  );

  useEffect(() => {
    if (!storedMessages || initialized.current) return;
    if (storedMessages.length > 0) {
      const today = new Date();
      const isOld = storedMessages.some((m) => {
        const d = new Date(m.timestamp);
        return d.getFullYear() !== today.getFullYear() || d.getMonth() !== today.getMonth() || d.getDate() !== today.getDate();
      });
      if (isOld) {
        db.messages.clear();
      } else {
        setMessages(storedMessages);
      }
    }
    initialized.current = true;
  }, [storedMessages, setMessages]);

  useEffect(() => {
    if (!initialized.current || messages.length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const toStore = messages.map((m, i) => ({
        ...m,
        timestamp: Date.now(),
        sequence: i,
      }));
      await db.transaction("rw", db.messages, async () => {
        await db.messages.clear();
        await db.messages.bulkAdd(toStore);
      });
    }, 300);
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const submit = useCallback(
    (text?: string) => {
      const value = (text ?? draft).trim();
      if (!value || status === "streaming" || status === "submitted") return;
      sendMessage({ text: value });
      setDraft("");
    },
    [draft, status, sendMessage]
  );

  const clear = useCallback(() => {
    setMessages([]);
    db.messages.clear();
  }, [setMessages]);

  const copyChat = useCallback(() => {
    const text = messages
      .map((m) => {
        const role = m.role === "user" ? "You" : "AI";
        const content = m.parts.filter(p => p.type === "text").map(p => p.text).join("");
        return `${role}: ${content}`;
      })
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [messages]);

  const isStreaming = status === "streaming" || status === "submitted";
  const empty = messages.length === 0;

  return (
    <div className="flex size-full w-full flex-col overflow-hidden bg-background border-l border-border">
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-border bg-sidebar">
        <h2 className="text-sm font-semibold">Chat</h2>
        <div className="flex items-center">
          <button
            type="button"
            onClick={copyChat}
            disabled={empty}
            className="size-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rounded-md"
            aria-label="Copy chat"
          >
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={empty}
            className="size-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rounded-md"
            aria-label="Clear chat"
          >
            <Trash2Icon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="size-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Close chat"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
        </div>
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="flex flex-col gap-8 p-4">
          {messages.map((message: UIMessage) => (
            <Message key={message.id} from={message.role} className="max-w-[90%]">
              <Metadata
                parts={message.parts as MyUIMessage["parts"]}
                streaming={isStreaming}
              />
              {message.parts
                .filter((part) => part.type === "text")
                .map((part, index) => (
                  <MessageContent key={`${message.id}-${part.type}-${index}`}>
                    {message.role === "user" ? (
                      <span className="text-wrap">{part.text}</span>
                    ) : (
                      <MessageResponse className="text-wrap [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2" linkSafety={{ enabled: false }}>
                        {part.text}
                      </MessageResponse>
                    )}
                  </MessageContent>
                ))}
            </Message>
          ))}
          {status === "submitted" && (
            <div className="size-12 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton className="border-none bg-foreground text-background hover:bg-foreground/80 hover:text-background" />
      </Conversation>

      <div className="relative grid w-auto shrink-0 gap-4 p-4">
        {empty && (
          <>
            <Suggestions className="flex-col items-start gap-px">
              {hints.map((s) => (
                <Suggestion
                  key={s}
                  className="rounded-none p-0"
                  onClick={() => submit(s)}
                  suggestion={s}
                  variant="link"
                />
              ))}
            </Suggestions>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              Tip: You can open and close chat with{" "}
              <span className="inline-flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-transparent px-1 font-sans text-xs font-medium select-none">&#8984;</kbd>
                <kbd className="pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-transparent px-1 font-sans text-xs font-medium select-none">I</kbd>
              </span>
            </p>
          </>
        )}

        <div className="relative flex w-full items-center rounded-md border border-input shadow-xs dark:bg-input/30 has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-ring/50 has-[textarea:focus-visible]:ring-[3px] flex-col">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              if (e.target.value.length <= 1000) setDraft(e.target.value);
            }}
            onCompositionStart={() => { composing.current = true; }}
            onCompositionEnd={() => { composing.current = false; }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !composing.current) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="What would you like to know?"
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-0 p-3 min-h-16 max-h-48"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <div className="flex w-full items-center justify-between px-3 pb-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              {draft.length} / 1000
            </p>
            <button
              type="button"
              onClick={() => isStreaming ? stop() : submit()}
              disabled={!isStreaming && !draft.trim()}
              className={cn(
                "size-8 rounded-md inline-flex items-center justify-center transition-colors",
                draft.trim() || isStreaming
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-primary/30 text-primary-foreground/50"
              )}
              aria-label={isStreaming ? "Stop" : "Submit"}
            >
              {status === "submitted" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : status === "streaming" ? (
                <SquareIcon className="size-4" />
              ) : status === "error" ? (
                <XIcon className="size-4" />
              ) : (
                <CornerDownLeftIcon className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}


export function Chat() {
  const { isOpen, setIsOpen } = useChatState();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return;
    const width = isOpen ? "384px" : "";
    document.body.style.marginRight = width;
    document.body.style.transition = "margin-right 200ms ease-out";
    const header = document.querySelector("header") as HTMLElement | null;
    if (header) {
      header.style.right = width;
      header.style.transition = "right 200ms ease-out";
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsOpen]);

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="h-[80dvh] bg-sidebar" aria-describedby={undefined}>
          <DrawerTitle className="sr-only">Chat</DrawerTitle>
          <ChatInner isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-[60] w-3/4 sm:max-w-sm bg-background font-sans transition-transform duration-200 ease-out translate-x-full data-[state=open]:translate-x-0"
      data-state={isOpen ? "open" : "closed"}
    >
      <ChatInner isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
