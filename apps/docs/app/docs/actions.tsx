"use client";

import { useChatState } from "@/lib/chatstate";
import {
  ArrowUpCircleIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import {
  OpenIn,
  OpenInChatGPT,
  OpenInClaude,
  OpenInContent,
  OpenInCursor,
  OpenInScira,
  OpenInT3,
  OpenInTrigger,
  OpenInv0,
} from "@/components/ai-elements/open-in-chat";

const linkClass = "flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground font-sans";

function ScrollTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={linkClass}
    >
      <ArrowUpCircleIcon className="size-3.5" />
      <span>Scroll to top</span>
    </button>
  );
}

function CopyPage() {
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  const handleCopy = useCallback(() => {
    const article = document.querySelector("article");
    if (!article) return;
    navigator.clipboard.writeText(article.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <button type="button" onClick={handleCopy} className={linkClass}>
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      <span>{copied ? "Copied" : "Copy page"}</span>
    </button>
  );
}

function AskAiAboutPage() {
  const { setIsOpen } = useChatState();

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className={linkClass}
    >
      <MessageCircleIcon className="size-3.5" />
      <span>Ask AI about this page</span>
    </button>
  );
}

function OpenInChat() {
  const pathname = usePathname();
  const url = `https://shop-docs.vercel.app${pathname}`;
  const query = `Read this documentation page and answer questions about it: ${url}`;

  return (
    <OpenIn query={query}>
      <OpenInTrigger>
        <button type="button" className={linkClass}>
          <ExternalLinkIcon className="size-3.5" />
          <span>Open in chat</span>
        </button>
      </OpenInTrigger>
      <OpenInContent>
        <OpenInv0 />
        <OpenInChatGPT />
        <OpenInClaude />
        <OpenInT3 />
        <OpenInScira />
        <OpenInCursor />
      </OpenInContent>
    </OpenIn>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={linkClass}
    >
      {isDark ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

export function PageActions({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-2.5 mt-6 pt-6 border-t border-border font-sans">
      <ScrollTop />
      <CopyPage />
      <AskAiAboutPage />
      <OpenInChat />
      <ThemeToggle />
    </div>
  );
}
