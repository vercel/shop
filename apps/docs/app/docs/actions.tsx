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
import { useCallback, useEffect, useState } from "react";
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

const linkClass = "flex items-center gap-1.5 text-gray-800 text-sm transition-colors hover:text-gray-1000 font-sans";

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
  const origin = typeof window !== "undefined" ? window.location.origin : "https://shop-docs.vercel.app";
  const url = `${origin}${pathname}`;
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

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

export function PageActions() {
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
