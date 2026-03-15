"use client";

import { useChat } from "@ai-sdk/react";
import {
  JSONUIProvider,
  Renderer,
  useJsonRenderMessage,
} from "@json-render/react";
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
  PaperclipIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
  SettingsIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StickyNoteIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { nanoid } from "nanoid";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollContain } from "@/hooks/use-scroll-contain";
import { registry } from "@/lib/agent/ui/registry";
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
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "../ai-elements/prompt-input";
import { Shimmer } from "../ai-elements/shimmer";
import { SpeechInput } from "../ai-elements/speech-input";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { CartReconciler } from "./cart-reconciler";

const easing = [0.32, 0.72, 0, 1] as const;
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
      messages: Array.isArray(parsed.messages)
        ? (parsed.messages as UIMessage[])
        : [],
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

function AttachButton() {
  const { openFileDialog } = usePromptInputAttachments();
  return (
    <PromptInputButton
      className="ml-1.5 shrink-0"
      onClick={() => openFileDialog()}
      aria-label="Add attachment"
    >
      <PaperclipIcon className="size-4" />
    </PromptInputButton>
  );
}

function AttachmentChips() {
  const { files, remove } = usePromptInputAttachments();
  if (!files.length) return null;

  return (
    <div className="flex w-full flex-wrap gap-1.5 px-3 pb-1.5 pt-2.5">
      {files.map((file) => {
        const imageUrl = typeof file.url === "string" ? file.url : null;
        const isImage = Boolean(
          file.mediaType?.startsWith("image/") && imageUrl,
        );
        const label = file.filename || "Attachment";

        return (
          <HoverCard key={file.id} openDelay={200} closeDelay={0}>
            <HoverCardTrigger asChild>
              <div className="flex h-7 cursor-default items-center gap-1 rounded-md bg-background/80 px-2 text-xs">
                {isImage ? (
                  <Image
                    src={imageUrl ?? ""}
                    alt={label}
                    className="size-4 shrink-0 rounded object-cover"
                    height={16}
                    unoptimized
                    width={16}
                  />
                ) : (
                  <PaperclipIcon className="size-3 shrink-0 text-muted-foreground" />
                )}
                <span className="max-w-32 truncate">{label}</span>
                <button
                  type="button"
                  className="ml-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => remove(file.id)}
                  aria-label={`Remove ${label}`}
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            </HoverCardTrigger>
            <HoverCardContent side="top" align="start" className="w-auto p-2">
              {isImage ? (
                <Image
                  src={imageUrl ?? ""}
                  alt={label}
                  className="max-h-48 max-w-64 rounded-md object-contain"
                  height={192}
                  unoptimized
                  width={256}
                />
              ) : (
                <div className="space-y-1 px-1">
                  <p className="font-medium text-sm">{label}</p>
                  {file.mediaType && (
                    <p className="font-mono text-muted-foreground text-xs">
                      {file.mediaType}
                    </p>
                  )}
                </div>
              )}
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}

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
  const isStreamingThisMessage =
    status === "streaming" && message.id === messages.at(-1)?.id;

  const chainParts = message.parts.filter(
    (part) => part.type === "reasoning" || getToolNameFromPart(part) !== null,
  );
  const hasChain = chainParts.length > 0;

  const hasActiveWork = chainParts.some((part) => {
    if (part.type === "reasoning") return isStreamingThisMessage;
    if ("state" in part) {
      const state = part.state as string;
      return !["output-available", "output-error", "output-denied"].includes(
        state,
      );
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
                  <MessageResponse linkSafety={linkSafety}>
                    {part.text}
                  </MessageResponse>
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
        <ChainOfThought
          open={isChainOpen}
          onOpenChange={setIsChainOpen}
          className="mb-4 w-full"
        >
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
                      isStreamingThisMessage &&
                      part === chainParts[chainParts.length - 1]
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
          {isLastAssistant && (
            <BotMessageSquareIcon className="size-5 shrink-0 text-primary" />
          )}
          <MessageContent>
            {text && (
              <MessageResponse linkSafety={linkSafety}>{text}</MessageResponse>
            )}
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
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragCountRef = useRef(0);

  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathname === prevPathnameRef.current) {
      return;
    }
    prevPathnameRef.current = pathname;
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  const { messages, sendMessage, status, regenerate } = useChat({
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

  useEffect(() => {
    if (!open) return;

    function handleDragEnter() {
      dragCountRef.current++;
      setIsDragging(true);
    }

    function handleDragLeave() {
      dragCountRef.current--;
      if (dragCountRef.current === 0) {
        setIsDragging(false);
      }
    }

    function handleDrop() {
      dragCountRef.current = 0;
      setIsDragging(false);
    }

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [open]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);
      if (!(hasText || hasAttachments)) {
        return;
      }

      sendMessage({
        text: message.text || "Sent with attachments",
        files: message.files,
      });
      setInput("");
    },
    [sendMessage],
  );

  const lastAssistantIndex = messages.findLastIndex(
    (m) => m.role === "assistant",
  );

  return (
    <>
      <CartReconciler messages={messages} />
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label={t("assistantLabel")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: easing }}
            className="fixed left-1/2 bottom-20 z-40 flex max-h-[min(40rem,80vh)] w-[calc(100vw-2rem)] max-w-160 -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-background/95 shadow-[0px_2px_4px_0px_rgba(90,90,90,0.30)] outline -outline-offset-1 outline-border/35 backdrop-blur-sm"
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 backdrop-blur-sm">
                <UploadIcon className="size-8 text-primary/60" />
                <p className="font-medium text-primary/80 text-sm">
                  {t("dropFiles")}
                </p>
              </div>
            )}

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/35 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{t("name")}</span>
                <span className="text-muted-foreground text-sm">
                  {t("title")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={t("minimizeAssistant")}
              >
                <MinusIcon className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              data-slot="messages"
            >
              <Conversation>
                <ConversationContent>
                  {messages.length === 0 && (
                    <div className="flex items-start gap-3">
                      <BotMessageSquareIcon className="size-5 shrink-0 text-primary mt-0.5" />
                      <p className="pt-2 text-sm text-foreground">
                        {t("greeting")}
                      </p>
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
              className="px-4 py-3 **:data-[slot=input-group]:h-auto **:data-[slot=input-group]:flex-col **:data-[slot=input-group]:rounded-2xl **:data-[slot=input-group]:border-0 **:data-[slot=input-group]:bg-input **:data-[slot=input-group]:shadow-none"
              globalDrop
              multiple
            >
              <AttachmentChips />
              <div className="flex w-full items-center">
                <AttachButton />
                <PromptInputBody>
                  <PromptInputTextarea
                    autoFocus
                    className="min-h-0 py-3 text-sm"
                    onChange={(e) => setInput(e.target.value)}
                    value={input}
                  />
                </PromptInputBody>
                <SpeechInput
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0 bg-transparent text-foreground/50 hover:bg-transparent hover:text-foreground"
                  onTranscriptionChange={(text) => {
                    setInput((prev) => (prev ? `${prev} ${text}` : text));
                  }}
                />
                <PromptInputSubmit
                  className="mr-1.5"
                  disabled={!input && !status}
                  status={status}
                />
              </div>
            </PromptInput>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
