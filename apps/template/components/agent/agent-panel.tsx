"use client";

import { useChat } from "@ai-sdk/react";
import { JSONUIProvider, Renderer, useJsonRenderMessage } from "@json-render/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  BotMessageSquareIcon,
  BrainIcon,
  ClipboardListIcon,
  CopyIcon,
  DotIcon,
  FileTextIcon,
  FolderOpenIcon,
  LayoutGridIcon,
  type LucideIcon,
  MapPinIcon,
  MinusIcon,
  NavigationIcon,
  PackageIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
  SettingsIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StickyNoteIcon,
  Trash2Icon,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScrollContain } from "@/hooks/use-scroll-contain";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "../ai-elements/chain-of-thought";
import { Conversation, ConversationContent } from "../ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "../ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "../ai-elements/prompt-input";
import { Shimmer } from "../ai-elements/shimmer";
import { CartReconciler } from "./cart-reconciler";
import { registry } from "./registry";

const AUTO_CLOSE_DELAY = 1000;
const AGENT_CHAT_STORAGE_KEY = "template-agent-chat:v1";

type PersistedAgentChat = {
  version: 1;
  chatId: string;
  input: string;
  messages: UIMessage[];
};

function createEmptyPersistedAgentChat(): PersistedAgentChat {
  return {
    version: 1,
    chatId: nanoid(),
    input: "",
    messages: [],
  };
}

function readPersistedAgentChat(): PersistedAgentChat {
  const fallback = createEmptyPersistedAgentChat();

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(AGENT_CHAT_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedAgentChat>;
    if (parsed.version !== 1) {
      return fallback;
    }

    return {
      version: 1,
      chatId:
        typeof parsed.chatId === "string" && parsed.chatId.length > 0
          ? parsed.chatId
          : fallback.chatId,
      input: typeof parsed.input === "string" ? parsed.input : "",
      messages: Array.isArray(parsed.messages) ? (parsed.messages as UIMessage[]) : [],
    };
  } catch {
    return fallback;
  }
}

function writePersistedAgentChat(chat: PersistedAgentChat): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AGENT_CHAT_STORAGE_KEY, JSON.stringify(chat));
  } catch {
    // Ignore storage failures such as quota exceeded.
  }
}

function getToolNameFromPart(part: UIMessage["parts"][number]): string | null {
  if (part.type === "dynamic-tool" && "toolName" in part) {
    return part.toolName as string;
  }
  if (part.type.startsWith("tool-")) {
    return part.type.slice(5);
  }
  return null;
}

function getToolStepStatus(state: string): "complete" | "active" | "pending" {
  switch (state) {
    case "output-available":
    case "output-error":
    case "output-denied":
      return "complete";
    default:
      return "active";
  }
}

const TOOL_METADATA: Record<string, { label: string; icon: LucideIcon }> = {
  searchProducts: { label: "Searching products", icon: SearchIcon },
  getProductDetails: { label: "Looking up product details", icon: PackageIcon },
  getProductRecommendations: {
    label: "Finding recommendations",
    icon: SparklesIcon,
  },
  listCollections: { label: "Listing collections", icon: LayoutGridIcon },
  browseCollection: { label: "Browsing collection", icon: FolderOpenIcon },
  addToCart: { label: "Adding to cart", icon: PlusIcon },
  getCart: { label: "Checking cart", icon: ShoppingCartIcon },
  updateCartItemQuantity: { label: "Updating cart", icon: SettingsIcon },
  removeFromCart: { label: "Removing from cart", icon: Trash2Icon },
  addCartNote: { label: "Adding cart note", icon: StickyNoteIcon },
  navigateUser: { label: "Navigating", icon: NavigationIcon },
  getOrderHistory: { label: "Looking up orders", icon: ClipboardListIcon },
  getOrderDetails: { label: "Fetching order details", icon: FileTextIcon },
  getAddresses: { label: "Loading addresses", icon: MapPinIcon },
  manageAddress: { label: "Managing address", icon: MapPinIcon },
};

function getToolMeta(toolName: string) {
  return TOOL_METADATA[toolName] ?? { label: toolName, icon: DotIcon };
}

function getMessagePartKey(part: UIMessage["parts"][number]): string {
  if ("toolCallId" in part && typeof part.toolCallId === "string") {
    return `${part.type}-${part.toolCallId}`;
  }

  if (part.type === "text") {
    return `${part.type}-${part.text}`;
  }

  return `${part.type}-${JSON.stringify(part)}`;
}

// Safelist relative paths so navigateTool links (e.g. "/en-US/cart") skip the external-link modal
const linkSafety = {
  enabled: true,
  onLinkCheck: (url: string) => url.startsWith("/"),
};

function ChatMessage({
  message,
  isLastAssistant,
  status,
  messages,
  regenerate,
}: {
  message: UIMessage;
  isLastAssistant: boolean;
  status: string;
  messages: UIMessage[];
  regenerate: () => void;
}) {
  const t = useTranslations("agent");
  const { spec, text, hasSpec } = useJsonRenderMessage(message.parts);

  // Chain of thought state — hooks must be before early return
  const isStreamingThisMessage = status === "streaming" && message.id === messages.at(-1)?.id;

  const chainParts = message.parts.filter(
    (part) => part.type === "reasoning" || getToolNameFromPart(part) !== null,
  );
  const hasChain = chainParts.length > 0;

  const hasActiveWork = chainParts.some((part) => {
    if (part.type === "reasoning") return isStreamingThisMessage;
    if ("state" in part) {
      const state = part.state as string;
      return !["output-available", "output-error", "output-denied"].includes(state);
    }
    return false;
  });

  const [isChainOpen, setIsChainOpen] = useState(hasActiveWork);
  const [hasAutoClosed, setHasAutoClosed] = useState(false);

  useEffect(() => {
    if (hasActiveWork) {
      setIsChainOpen(true);
    } else if (hasChain && isChainOpen && !hasAutoClosed) {
      const timer = setTimeout(() => {
        setIsChainOpen(false);
        setHasAutoClosed(true);
      }, AUTO_CLOSE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [hasActiveWork, hasChain, isChainOpen, hasAutoClosed]);

  if (message.role === "user") {
    return (
      <div>
        {message.parts.map((part) => {
          if (part.type === "text") {
            return (
              <Message key={getMessagePartKey(part)} from="user">
                <MessageContent>
                  <MessageResponse linkSafety={linkSafety}>{part.text}</MessageResponse>
                </MessageContent>
              </Message>
            );
          }
          return null;
        })}
      </div>
    );
  }

  return (
    <div>
      {hasChain && (
        <ChainOfThought open={isChainOpen} onOpenChange={setIsChainOpen} className="mb-4 w-full">
          <ChainOfThoughtHeader>
            {hasActiveWork ? (
              <Shimmer duration={1}>Working...</Shimmer>
            ) : (
              `Worked through ${chainParts.length} step${chainParts.length !== 1 ? "s" : ""}`
            )}
          </ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            {chainParts.map((part) => {
              if (part.type === "reasoning") {
                return (
                  <ChainOfThoughtStep
                    key={getMessagePartKey(part)}
                    icon={BrainIcon}
                    label="Thinking"
                    status={
                      isStreamingThisMessage && part === chainParts[chainParts.length - 1]
                        ? "active"
                        : "complete"
                    }
                  />
                );
              }

              const toolName = getToolNameFromPart(part);
              if (!toolName) {
                return null;
              }

              const meta = getToolMeta(toolName);
              const state = (part as { state: string }).state;

              return (
                <ChainOfThoughtStep
                  key={getMessagePartKey(part)}
                  icon={meta.icon}
                  label={meta.label}
                  status={getToolStepStatus(state)}
                />
              );
            })}
          </ChainOfThoughtContent>
        </ChainOfThought>
      )}

      {(text || hasSpec) && (
        <Message from="assistant">
          {isLastAssistant && <BotMessageSquareIcon className="size-5 shrink-0 text-primary" />}
          <MessageContent>
            {text && <MessageResponse linkSafety={linkSafety}>{text}</MessageResponse>}
            {hasSpec && spec && (
              <JSONUIProvider registry={registry}>
                <Renderer spec={spec} registry={registry} />
              </JSONUIProvider>
            )}
          </MessageContent>
          {isLastAssistant && (
            <MessageActions>
              <MessageAction onClick={() => regenerate()} label={t("retry")}>
                <RefreshCcwIcon className="size-3" />
              </MessageAction>
              <MessageAction
                onClick={() => navigator.clipboard.writeText(text || "")}
                label={t("copy")}
              >
                <CopyIcon className="size-3" />
              </MessageAction>
            </MessageActions>
          )}
        </Message>
      )}
    </div>
  );
}

export interface AgentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function AgentPanel({ open, onOpenChange, triggerRef }: AgentPanelProps) {
  const t = useTranslations("agent");
  const [persistedChat] = useState(readPersistedAgentChat);
  const [input, setInput] = useState(persistedChat.input);
  const panelRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathname === prevPathnameRef.current) {
      return;
    }
    prevPathnameRef.current = pathname;
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  const { messages, sendMessage, setMessages, status, regenerate, stop } = useChat({
    id: persistedChat.chatId,
    generateId: () => nanoid(),
    messages: persistedChat.messages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId: persistedChat.chatId },
    }),
  });

  useEffect(() => {
    writePersistedAgentChat({
      version: 1,
      chatId: persistedChat.chatId,
      input,
      messages,
    });
  }, [persistedChat.chatId, input, messages]);

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
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useScrollContain(panelRef, open);

  const scrollMessagesToBottom = useCallback(() => {
    const el = panelRef.current?.querySelector<HTMLElement>("[data-slot=messages]");
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text) {
        return;
      }

      sendMessage({ text: message.text });
      setInput("");
    },
    [sendMessage],
  );

  const handleClear = useCallback(() => {
    if (status === "streaming" || status === "submitted") {
      stop();
    }

    setInput("");
    setMessages([]);
    writePersistedAgentChat({
      version: 1,
      chatId: persistedChat.chatId,
      input: "",
      messages: [],
    });
  }, [persistedChat.chatId, setMessages, status, stop]);

  const canClear = messages.length > 0 || input.trim().length > 0;
  const lastAssistantIndex = messages.findLastIndex((m) => m.role === "assistant");

  return (
    <>
      <CartReconciler messages={messages} />
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

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-slot="messages">
          <Conversation>
            <ConversationContent>
              {messages.length === 0 && (
                <div className="flex items-start gap-2.5">
                  <BotMessageSquareIcon className="size-5 shrink-0 text-primary mt-0.5" />
                  <p className="pt-2 text-sm text-foreground">{t("greeting")}</p>
                </div>
              )}
              {messages.map((message, messageIndex) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLastAssistant={messageIndex === lastAssistantIndex}
                  status={status}
                  messages={messages}
                  regenerate={regenerate}
                />
              ))}
            </ConversationContent>
          </Conversation>
        </div>

        {/* Input */}
        <PromptInput
          onSubmit={handleSubmit}
          className="px-5 py-2.5 **:data-[slot=input-group]:h-auto **:data-[slot=input-group]:flex-col **:data-[slot=input-group]:rounded-2xl **:data-[slot=input-group]:border-0 **:data-[slot=input-group]:bg-input **:data-[slot=input-group]:shadow-none"
        >
          <div className="flex w-full items-center">
            <PromptInputBody>
              <PromptInputTextarea
                autoFocus
                className="min-h-0 py-2.5 text-sm"
                onChange={(e) => setInput(e.target.value)}
                value={input}
              />
            </PromptInputBody>
            <PromptInputSubmit className="mr-1.5" disabled={!input && !status} status={status} />
          </div>
        </PromptInput>
      </div>
    </>
  );
}
