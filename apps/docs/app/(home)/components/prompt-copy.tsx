"use client";

import { track } from "@vercel/analytics";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COPY_TIMEOUT = 2000;

interface PromptCopyProps {
  className?: string;
  description?: string;
  prompt: string;
  title?: string;
}

export const PromptCopy = ({
  className,
  description = "Paste into Codex, Claude Code, or Cursor.",
  prompt,
  title = "Agent prompt",
}: PromptCopyProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, COPY_TIMEOUT);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    track("Copied starter prompt");
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <div className={cn("w-full rounded-xl border bg-background/90 p-3 text-left shadow-xs", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button className="shrink-0" onClick={handleCopy} size="sm" type="button" variant="outline">
          <Icon className="size-3.5" />
          <span>{copied ? "Copied" : "Copy prompt"}</span>
        </Button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg border bg-muted/20 p-3 font-mono text-sm leading-6 whitespace-pre-wrap">
        {prompt}
      </pre>
    </div>
  );
};
